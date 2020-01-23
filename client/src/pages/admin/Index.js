import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import {
  PageDispatchersPropType,
  jumpToTop,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Field, Form, Formik } from "formik"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_ADMIN_SETTINGS = gql`
  query {
    adminSettings {
      key
      value
    }
  }
`
const GQL_SAVE_ADMIN_SETTINGS = gql`
  mutation($settings: [AdminSettingInput]!) {
    saveAdminSettings(settings: $settings)
  }
`

const BaseAdminIndex = ({ pageDispatchers, loadAppData }) => {
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_ADMIN_SETTINGS
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const settings = {}
  data.adminSettings.forEach(setting => (settings[setting.key] = setting.value))

  return (
    <div>
      <Messages success={saveSuccess} error={saveError} />
      <Formik enableReinitialize onSubmit={onSubmit} initialValues={settings}>
        {({ values, isSubmitting, submitForm }) => {
          const action = (
            <div>
              <Button
                bsStyle="primary"
                type="button"
                onClick={submitForm}
                disabled={isSubmitting}
              >
                Save settings
              </Button>
            </div>
          )
          return (
            <Form className="form-horizontal" method="post">
              <Fieldset title="Site settings" action={action} />
              <Fieldset>
                {Object.map(settings, (key, value) => (
                  <Field
                    key={key}
                    name={key}
                    component={FieldHelper.InputField}
                  />
                ))}
              </Fieldset>
              <div className="submit-buttons">
                <div />
                {action}
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setSaveError(error)
        setSaveSuccess()
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    setSaveError()
    setSaveSuccess("Admin settings saved")
    jumpToTop()
    loadAppData()
    refetch()
  }

  function save(values, form) {
    // settings as JSON
    const settings = Object.map(values, (key, value) => ({ key, value }))
    return API.mutation(GQL_SAVE_ADMIN_SETTINGS, { settings })
  }
}

BaseAdminIndex.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  loadAppData: PropTypes.func
}

const AdminIndex = props => (
  <AppContext.Consumer>
    {context => <BaseAdminIndex loadAppData={context.loadAppData} {...props} />}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(AdminIndex)
