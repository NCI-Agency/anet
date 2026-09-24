import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import { jumpToTop, usePageTitle } from "components/Page"
import PreferencesFieldset from "components/preferences/PreferencesFieldSet"
import React, { useContext, useState } from "react"

const GQL_UPDATE_PREFERENCES = gql`
  mutation ($preferences: [PreferenceInput]!) {
    updatePreferences(preferences: $preferences)
  }
`
const Preferences = () => {
  const { loadAppData } = useContext(AppContext)
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

  async function onSubmitSuccess(values, form) {
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    setSaveError(null)
    setSaveSuccess(`${title} saved`)
    await loadAppData()
    jumpToTop()
  }

  function handleError(error) {
    setSaveError(error)
    setSaveSuccess(null)
    jumpToTop()
  }
}

export default Preferences
