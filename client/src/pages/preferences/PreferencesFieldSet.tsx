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
import React from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

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
  if (done) {
    return result
  }
  if (_get(data.preferenceList.list, "length", 0) === 0) {
    return <em>No preferences found</em>
  }

  const useUserPrefs =
    Array.isArray(userPreferences) && userPreferences.length > 0

  const preferences = data.preferenceList.list.map(genericPref => {
    let valueToUse = genericPref.defaultValue
    if (useUserPrefs) {
      const match = userPreferences.find(
        userPref => userPref.preference.uuid === genericPref.uuid
      )
      valueToUse = match ? match.value : genericPref.defaultValue
    }

    return {
      ...genericPref,
      value: convertStringValueToType(valueToUse, genericPref.type)
    }
  })

  const initialValues = preferences.reduce((acc, pref) => {
    acc[pref.uuid] = pref.value
    return acc
  }, {})

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {({ isSubmitting, dirty, setFieldValue, submitForm }) => {
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
              <Fieldset>
                {preferences.map(preference => (
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

                    {preference.type === "enumset" && (
                      <FastField name={preference.uuid}>
                        {({ field, form }) => {
                          const choices = preference.allowedValues
                            ? Object.fromEntries(
                                preference.allowedValues.split(",").map(v => [
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

                          const buttons = FieldHelper.customEnumButtons(choices)
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
                                form.setFieldValue(preference.uuid, newValue)
                              }}
                            />
                          )
                        }}
                      </FastField>
                    )}
                  </React.Fragment>
                ))}
              </Fieldset>
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

  function convertStringValueToType(value: any, type: string) {
    if (type === "boolean") {
      return String(value).toLowerCase() === "true"
    }
    return value
  }

  function getLabelFromDictionary(
    preferenceName: string,
    field: string
  ): string {
    const key = preferenceName.split("_")[0]
    const label = Settings.fields[key]?.[field]?.label
    return label ?? field
  }
}

export default connect(null, mapPageDispatchersToProps)(PreferencesFieldset)
