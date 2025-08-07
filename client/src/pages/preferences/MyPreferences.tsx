import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import { jumpToTop, mapPageDispatchersToProps } from "components/Page"
import PreferencesFieldset from "pages/preferences/PreferencesFieldSet"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"

const GQL_UPDATE_PERSON_PREFERENCES = gql`
  mutation ($preferences: [PersonPreferenceInput]!) {
    updatePersonPreferences(preferences: $preferences)
  }
`

interface MyPreferencesProps {
  category?: string
  actionOnSubmit?: () => void
}

const MyPreferences = ({
  category = null,
  actionOnSubmit = null
}: MyPreferencesProps) => {
  const { currentUser } = useContext(AppContext)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  return (
    <PreferencesFieldset
      category={category}
      userPreferences={currentUser.preferences}
      onSubmit={onSubmit}
      saveSuccess={saveSuccess}
      saveError={saveError}
      title="My Preferences"
    />
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
      .then(() => onSubmitSuccess(values, form))
      .catch(error => {
        handleError(error)
        form.setSubmitting(false)
      })
  }

  function onSubmitSuccess(values, form) {
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    setSaveError(null)
    setSaveSuccess("Preferences saved")
    jumpToTop()
    if (typeof actionOnSubmit === "function") {
      actionOnSubmit()
    }
  }

  function handleError(error) {
    setSaveError(error)
    setSaveSuccess(null)
    jumpToTop()
  }
}

export default connect(null, mapPageDispatchersToProps)(MyPreferences)
