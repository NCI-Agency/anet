import { gql } from "@apollo/client"
import API from "api"
import { jumpToTop, usePageTitle } from "components/Page"
import PreferencesFieldset from "components/preferences/PreferencesFieldSet"
import React, { useState } from "react"

const GQL_UPDATE_PREFERENCES = gql`
  mutation ($preferences: [PreferenceInput]!) {
    updatePreferences(preferences: $preferences)
  }
`
const Preferences = () => {
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const title = "Default Application Preferences"
  usePageTitle(title)
  return (
    <PreferencesFieldset
      onSubmit={onSubmit}
      saveSuccess={saveSuccess}
      saveError={saveError}
      title={title}
    />
  )

  function onSubmit(values, form, refetch) {
    const preferences = Object.entries(values).map(([key, value]) => ({
      uuid: key,
      defaultValue: String(value)
    }))

    return API.mutation(GQL_UPDATE_PREFERENCES, { preferences })
      .then(() => onSubmitSuccess(values, form, refetch))
      .catch(error => {
        handleError(error)
        form.setSubmitting(false)
      })
  }

  function onSubmitSuccess(values, form, refetch) {
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    setSaveError(null)
    setSaveSuccess(`${title} saved`)
    refetch()
    jumpToTop()
  }

  function handleError(error) {
    setSaveError(error)
    setSaveSuccess(null)
    jumpToTop()
  }
}

export default Preferences
