import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { FastField, Field, Form, Formik } from "formik"
import _get from "lodash/get"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_PREFERENCES = gql`
  query {
    preferences {
      uuid
      name
      type
      description
      defaultValue
    }
  }
`
const GQL_UPDATE_PERSON_PREFERENCES = gql`
  mutation ($preferences: [PersonPreferenceInput]!) {
    updatePersonPreferences(preferences: $preferences)
  }
`

const stringToBool = str => {
  return str.toLowerCase() === "true"
}

const convertStringValueToPreferenceType = (value, type) => {
  if (type === "BOOLEAN") {
    return stringToBool(String(value))
  } else {
    return value
  }
}

interface MyPreferencesProps {
  pageDispatchers?: PageDispatchersPropType
}

const MyPreferences = ({ pageDispatchers }: MyPreferencesProps) => {
  const { currentUser } = useContext(AppContext)
  const { loadAppData } = useContext(AppContext)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_PREFERENCES)
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
  if (_get(data.preferences, "length", 0) === 0) {
    return <em>No preferences found</em>
  }

  const preferences = data.preferences.map(genericPref => {
    const match = currentUser.preferences.find(
      userPref => userPref.preference.uuid === genericPref.uuid
    )

    const valueToUse = match ? match.value : genericPref.defaultValue

    return {
      uuid: genericPref.uuid,
      description: genericPref.description,
      type: genericPref.type,
      value: convertStringValueToPreferenceType(valueToUse, genericPref.type)
    }
  })

  const initialValues = preferences.reduce((acc, pref) => {
    acc[pref.uuid] = pref.value
    return acc
  }, {})

  return (
    <div>
      <Formik
        enableReinitialize
        onSubmit={onSubmit}
        initialValues={initialValues}
      >
        {({
          isSubmitting,
          dirty,
          setFieldValue,
          setFieldTouched,
          values,
          submitForm
        }) => {
          const action = (
            <Button
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save preferences
            </Button>
          )
          return (
            <>
              <NavigationWarning isBlocking={dirty && !isSubmitting} />
              <Messages success={saveSuccess} error={saveError} />
              <Form className="form-horizontal" method="post">
                <Fieldset title="My Preferences" action={action} />
                <Fieldset>
                  {preferences.map(preference => (
                    <React.Fragment key={preference.uuid}>
                      {preference.type === "BOOLEAN" && (
                        <FastField
                          key={preference.uuid}
                          name={preference.uuid}
                          label={preference.description}
                          component={FieldHelper.RadioButtonToggleGroupField}
                          buttons={[
                            {
                              id: "isUser",
                              value: true,
                              label: "Yes"
                            },
                            {
                              id: "isNotUser",
                              value: false,
                              label: "No"
                            }
                          ]}
                          onChange={value => {
                            setFieldValue(preference.uuid, value)
                          }}
                        />
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
    </div>
  )

  function onSubmit(values, form) {
    const preferences = []

    Object.entries(values).forEach(([key, value]) => {
      // See if the logged user has a value for this preference
      const currentUserPreference = currentUser.preferences.find(
        userPref => userPref.preference.uuid === key
      )
      if (currentUserPreference) {
        currentUserPreference.value = String(value)
        preferences.push(currentUserPreference)
      } else {
        // Need to create the preference for this user
        preferences.push({
          preference: { uuid: key },
          person: { uuid: currentUser.uuid },
          value: String(value)
        })
      }
    })

    return API.mutation(GQL_UPDATE_PERSON_PREFERENCES, { preferences })
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        handleError(error)
        form.setSubmitting(false)
      })
  }

  function onSubmitSuccess(response, values, form) {
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    setSaveError(null)
    setSaveSuccess("Preferences saved")
    jumpToTop()
    loadAppData()
    refetch()
  }

  function handleError(error) {
    setSaveError(error)
    setSaveSuccess(null)
    jumpToTop()
  }
}

export default connect(null, mapPageDispatchersToProps)(MyPreferences)
