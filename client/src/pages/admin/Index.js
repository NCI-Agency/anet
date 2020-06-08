import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { Field, Form, Formik } from "formik"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Grid, Row } from "react-bootstrap"
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
const CLEAR_CACHE = gql`
  query {
    clearCache
  }
`
const RELOAD_DICTIONARY = gql`
  query {
    reloadDictionary
  }
`
const USER_ACTIVITIES = gql`
  query {
    userActivities
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
      <Fieldset title="Site actions" />
      <Fieldset>
        <Grid fluid>
          <Row style={{ padding: "8px 0" }}>
            <Col md={2}>Recent Users</Col>
            <Col md={10}>TODO ... </Col>
          </Row>
          <Row style={{ padding: "8px 0" }}>
            <Col md={2}>Clear Cache</Col>
            <Col md={10}>
              <Button bsStyle="primary" type="button" onClick={clearCache}>
                Clear
              </Button>
            </Col>
          </Row>
          <Row style={{ padding: "8px 0" }}>
            <Col md={2}>Reload Dictionary</Col>
            <Col md={10}>
              <Button
                bsStyle="primary"
                type="button"
                onClick={reloadDictionary}
              >
                Reload
              </Button>
            </Col>
          </Row>
          <Row style={{ padding: "8px 0" }}>
            <Col md={2}>User Activities</Col>
            <Col md={10}>
              <Button
                bsStyle="primary"
                type="button"
                onClick={userActivities}
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Grid>
      </Fieldset>
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

  function clearCache() {
    return API.query(CLEAR_CACHE, {}).then(data => {
      setSaveSuccess(data.clearCache)
      setSaveError()
      jumpToTop()
    })
    .catch(error => {
      setSaveError(error)
      setSaveSuccess()
      jumpToTop()
    })
  }

  function reloadDictionary() {
    return API.query(RELOAD_DICTIONARY, {}).then(data => {
      setSaveSuccess(data.reloadDictionary)
      jumpToTop()
    })
    .catch(error => {
      setSaveError(error)
      setSaveSuccess()
      jumpToTop()
    })
  }

  function userActivities() {
    return API.query(USER_ACTIVITIES, {}).then(data => {
      // TODO: Place a table to present data
      setSaveSuccess()
      console.log(data.userActivities)
    })
    .catch(error => {
      setSaveError(error)
      setSaveSuccess()
      jumpToTop()
    })
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
