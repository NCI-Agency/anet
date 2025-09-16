import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
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
  saveError
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

    return (data?.preferenceList?.list ?? []).map(genericPref => {
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
  }, [data?.preferenceList?.list, userPreferences])

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
    >
      {({ isSubmitting, dirty, setFieldValue, submitForm, values }) => {
        const action = (
          <Button
            variant="primary"
            onClick={submitForm}
            disabled={isSubmitting}
          >
            {actionLabel}
          </Button>
        )

        return (
          <>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages success={saveSuccess} error={saveError} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
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
                    />
                  ))}
                </Fieldset>
              )}

              <div className="submit-buttons">
                <div />
                <div>{action}</div>
              </div>
            </Form>
          </>
        )
      }}
    </Formik>
  )
}

export default connect(null, mapPageDispatchersToProps)(PreferencesFieldset)
