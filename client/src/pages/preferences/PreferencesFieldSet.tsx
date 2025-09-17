import { gql } from "@apollo/client"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES
} from "actions"
import API from "api"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { FastField, Form, Formik } from "formik"
import _get from "lodash/get"
import React, { useMemo } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"
import utils from "utils"
import ExportFieldsPanel from "./ExportFieldsPanel"

const GQL_GET_PREFERENCES = gql`
  query ($preferenceQuery: PreferenceSearchQueryInput) {
    preferenceList(query: $preferenceQuery) {
      list {
        uuid
        name
        type
        description
        defaultValue
        allowedValues
      }
    }
  }
`

const ENTITY_TO_OBJTYPE = {
  authorizationGroup: SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS,
  organization: SEARCH_OBJECT_TYPES.ORGANIZATIONS,
  person: SEARCH_OBJECT_TYPES.PEOPLE,
  position: SEARCH_OBJECT_TYPES.POSITIONS,
  task: SEARCH_OBJECT_TYPES.TASKS,
  location: SEARCH_OBJECT_TYPES.LOCATIONS,
  report: SEARCH_OBJECT_TYPES.REPORTS,
  event: SEARCH_OBJECT_TYPES.EVENTS,
  attachment: SEARCH_OBJECT_TYPES.ATTACHMENTS
}

interface UserPreference {
  preference: { uuid: string }
  value: string
}

interface PreferencesFieldsetProps {
  pageDispatchers?: PageDispatchersPropType
  category?: string
  userPreferences?: UserPreference[]
  onSubmit: (values: Record<string, any>, formikBag: any) => void
  title?: string
  actionLabel?: string
  saveSuccess?: string | null
  saveError?: any
  exportObjectTypes?: string[]
}

function isExportFieldsPref(name: string) {
  return name?.endsWith("_EXPORT_FIELDS")
}

function exportEntityFromPref(name: string) {
  return (name || "").replace(/_EXPORT_FIELDS$/, "")
}

function titleForExportPref(name: string) {
  const entity = exportEntityFromPref(name)
  const start = entity.replace(/([A-Z])/g, " $1").trim()
  const cap = start.charAt(0).toUpperCase() + start.slice(1)
  return `${cap} export fields`
}

function getLabelFromDictionary(preferenceName: string, field: string) {
  const key = preferenceName.split("_")[0]
  const label = Settings.fields[key]?.[field]?.label
  return label ?? field
}

function convertStringValueToType(value: any, type: string) {
  if (type === "boolean") {
    return String(value).toLowerCase() === "true"
  }
  return value
}

const PreferencesFieldset = ({
  pageDispatchers,
  category = null,
  userPreferences = [],
  onSubmit,
  title = "Preferences",
  actionLabel = "Save preferences",
  saveSuccess,
  saveError,
  exportObjectTypes = []
}: PreferencesFieldsetProps) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_PREFERENCES, {
    preferenceQuery: { category, pageNum: 0, pageSize: 0 }
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("My Preferences")

  const preferences = useMemo(() => {
    const useUserPrefs =
      Array.isArray(userPreferences) && userPreferences.length > 0

    const prefs = (data?.preferenceList?.list ?? []).map(genericPref => {
      let valueToUse = genericPref.defaultValue
      if (useUserPrefs) {
        const match = userPreferences.find(
          up => up.preference.uuid === genericPref.uuid
        )
        valueToUse = match ? match.value : genericPref.defaultValue
      }
      return {
        ...genericPref,
        value: convertStringValueToType(valueToUse, genericPref.type)
      }
    })

    if (!exportObjectTypes || exportObjectTypes.length === 0) {
      return prefs
    }

    return prefs.filter(pref => {
      if (!isExportFieldsPref(pref.name)) {
        return true
      }
      const entity = exportEntityFromPref(pref.name)
      const objType = ENTITY_TO_OBJTYPE[entity]
      return objType ? exportObjectTypes.includes(objType) : false
    })
  }, [data?.preferenceList?.list, userPreferences, exportObjectTypes])

  const exportPrefs = useMemo(
    () => preferences.filter(p => isExportFieldsPref(p.name)),
    [preferences]
  )
  const otherPrefs = useMemo(
    () => preferences.filter(p => !isExportFieldsPref(p.name)),
    [preferences]
  )

  const initialValues = useMemo(() => {
    return preferences.reduce((acc: Record<string, any>, pref: any) => {
      acc[pref.uuid] = pref.value
      return acc
    }, {})
  }, [preferences])

  if (done) {
    return result
  }
  if (_get(data.preferenceList.list, "length", 0) === 0) {
    return <em>No preferences found</em>
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize
      validate={vals => {
        const errors = {}
        exportPrefs.forEach(pref => {
          const selected = utils.splitCsv(vals[pref.uuid])
          if (selected.length === 0) {
            errors[pref.uuid] = "Please select at least one field"
          }
        })
        return errors
      }}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        submitForm,
        values,
        errors,
        validateForm
      }) => {
        const handleSaveClick = async () => {
          const errs = await validateForm()
          const keys = Object.keys(errs || {})
          if (keys.length > 0) {
            const first = keys[0]
            const el = document.getElementById(`pref-${first}`)
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            return
          }
          submitForm()
        }
        return (
          <>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages success={saveSuccess} error={saveError} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} />
              {otherPrefs.length > 0 && (
                <Fieldset title={exportPrefs.length > 0 ? "General" : ""}>
                  {otherPrefs.map(preference => (
                    <React.Fragment key={preference.uuid}>
                      {preference.type === "boolean" && (
                        <FastField
                          name={preference.uuid}
                          label={preference.description}
                          component={FieldHelper.RadioButtonToggleGroupField}
                          buttons={[
                            { id: "yes", value: true, label: "Yes" },
                            { id: "no", value: false, label: "No" }
                          ]}
                          onChange={value =>
                            setFieldValue(preference.uuid, value)
                          }
                        />
                      )}

                      {preference.type === "enumset" &&
                        !isExportFieldsPref(preference.name) && (
                          <FastField name={preference.uuid}>
                            {({ field, form }) => {
                              const choices = preference.allowedValues
                                ? Object.fromEntries(
                                    preference.allowedValues
                                      .split(",")
                                      .map((v: string) => [
                                        v.trim(),
                                        {
                                          label: getLabelFromDictionary(
                                            preference.name,
                                            v.trim()
                                          )
                                        }
                                      ])
                                  )
                                : {}
                              const buttons =
                                FieldHelper.customEnumButtons(choices)
                              const selected = field.value
                                ? field.value.split(",").map(v => v.trim())
                                : []

                              return (
                                <FieldHelper.CheckboxButtonToggleGroupField
                                  field={{ ...field, value: selected }}
                                  form={form}
                                  label={preference.description}
                                  buttons={buttons}
                                  enableClear
                                  onChange={selectedValues => {
                                    const newValue = selectedValues.join(",")
                                    form.setFieldValue(
                                      preference.uuid,
                                      newValue
                                    )
                                  }}
                                />
                              )
                            }}
                          </FastField>
                        )}
                    </React.Fragment>
                  ))}
                </Fieldset>
              )}

              {exportPrefs.length > 0 && (
                <Fieldset title={otherPrefs.length > 0 ? "Export fields" : ""}>
                  {exportPrefs.map(pref => (
                    <ExportFieldsPanel
                      key={pref.uuid}
                      pref={pref}
                      values={values}
                      initialSnapshot={initialValues}
                      setFieldValue={setFieldValue}
                      titleForExportPref={titleForExportPref}
                      getLabelFromDictionary={getLabelFromDictionary}
                      error={errors?.[pref.uuid] as string | undefined}
                    />
                  ))}
                </Fieldset>
              )}

              <div className="submit-buttons d-flex justify-content-end">
                <Button
                  variant="primary"
                  onClick={handleSaveClick}
                  disabled={isSubmitting}
                >
                  {actionLabel}
                </Button>
              </div>
            </Form>
          </>
        )
      }}
    </Formik>
  )
}

export default connect(null, mapPageDispatchersToProps)(PreferencesFieldset)
