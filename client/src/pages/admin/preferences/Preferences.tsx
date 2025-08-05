import { gql } from "@apollo/client"
import API from "api"
import { jumpToTop, mapPageDispatchersToProps } from "components/Page"
import PreferencesFieldset from "pages/preferences/PreferencesFieldSet"
import React, { useState } from "react"
import { connect } from "react-redux"

const GQL_UPDATE_PREFERENCES = gql`
  mutation ($preferences: [PreferenceInput]!) {
    updatePreferences(preferences: $preferences)
  }
`
const Preferences = () => {
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  return (
    <PreferencesFieldset
      onSubmit={onSubmit}
      saveSuccess={saveSuccess}
      saveError={saveError}
      title="User Preferences"
    />
  )

  function onSubmit(values, form) {
    const preferences = Object.entries(values).map(([key, value]) => ({
      uuid: key,
      defaultValue: String(value)
    }))

    return API.mutation(GQL_UPDATE_PREFERENCES, { preferences })
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
  }

  function handleError(error) {
    setSaveError(error)
    setSaveSuccess(null)
    jumpToTop()
  }
}

export default connect(null, mapPageDispatchersToProps)(Preferences)
