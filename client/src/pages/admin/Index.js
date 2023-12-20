import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import {
  GENERAL_BANNER_LEVEL,
  GENERAL_BANNER_LEVELS,
  GENERAL_BANNER_VISIBILITIES,
  GENERAL_BANNER_VISIBILITY
} from "components/GeneralBanner"
import Messages from "components/Messages"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Field, Form, Formik } from "formik"
import moment from "moment"
import RecentActivityTable from "pages/admin/RecentActivityTable"
import React, { useContext, useState } from "react"
import { Button, Col, Container, FormSelect, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { toast } from "react-toastify"
import { v4 as uuidv4 } from "uuid"

const DROPDOWN_FIELDS = [
  {
    name: GENERAL_BANNER_LEVEL,
    options: GENERAL_BANNER_LEVELS
  },
  {
    name: GENERAL_BANNER_VISIBILITY,
    options: GENERAL_BANNER_VISIBILITIES
  }
]

const GQL_GET_ADMIN_SETTINGS = gql`
  query {
    adminSettings {
      key
      value
    }
  }
`
const GQL_SAVE_ADMIN_SETTINGS = gql`
  mutation ($settings: [AdminSettingInput]!) {
    saveAdminSettings(settings: $settings)
  }
`

const CLEAR_CACHE = gql`
  mutation {
    clearCache
  }
`
const RELOAD_DICTIONARY = gql`
  mutation {
    reloadDictionary
  }
`
const RECENT_ACTIVITIES = gql`
  query {
    recentActivities {
      byActivity {
        ...recentActivity
      }
      byUser {
        ...recentActivity
      }
    }
  }

  fragment recentActivity on RecentUserActivity {
    user {
      uuid
      name
      rank
      role
      avatarUuid
      domainUsername
    }
    activity {
      time
      ip
      request
    }
  }
`
const AdminIndex = ({ pageDispatchers }) => {
  const { loadAppData } = useContext(AppContext)
  const [recentActivities, setRecentActivities] = useState(null)
  const [recentUsers, setRecentUsers] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [lastLoaded, setLastLoaded] = useState(null)
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
  usePageTitle("Admin")
  if (done) {
    return result
  }

  const settings = {}
  data.adminSettings.forEach(setting => (settings[setting.key] = setting.value))

  const recentActivitiesActionButton = (
    <Button
      disabled={actionLoading}
      variant="primary"
      onClick={loadRecentActivities}
    >
      {Array.isArray(recentActivities) || Array.isArray(recentUsers)
        ? "Reload"
        : "Load"}{" "}
      Recent Activities & Recent Users
    </Button>
  )

  const actionRowStyle = { display: "flex", alignItems: "center" }

  return (
    <div>
      <Messages success={saveSuccess} error={saveError} />
      <Formik enableReinitialize onSubmit={onSubmit} initialValues={settings}>
        {({ values, isSubmitting, submitForm }) => {
          const action = (
            <Button
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save settings
            </Button>
          )
          return (
            <Form className="form-horizontal" method="post">
              <Fieldset title="Site settings" action={action} />
              <Fieldset>
                {Object.map(settings, (key, value) => {
                  const dropdownField = DROPDOWN_FIELDS.find(
                    field => field.name === key
                  )
                  if (dropdownField) {
                    return (
                      <Field
                        name={key}
                        key={key}
                        component={FieldHelper.SpecialField}
                        widget={
                          <FormSelect className="form-control">
                            {Object.values(dropdownField.options).map(
                              option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              )
                            )}
                          </FormSelect>
                        }
                      />
                    )
                  }
                  return (
                    <Field
                      key={key}
                      name={key}
                      component={FieldHelper.InputField}
                    />
                  )
                })}
              </Fieldset>
              <div className="submit-buttons">
                <div />
                <div>{action}</div>
              </div>
            </Form>
          )
        }}
      </Formik>
      <Fieldset title="Site actions">
        <Container fluid>
          <Row style={{ paddingBottom: "24px", ...actionRowStyle }}>
            <Col md={2}>
              <Button
                disabled={actionLoading}
                variant="primary"
                onClick={clearCache}
                style={{ width: "100%" }}
              >
                Clear Cache
              </Button>
            </Col>
            <Col md={10}>Clears the "Domain Users Cache"</Col>
          </Row>
          <Row style={actionRowStyle}>
            <Col md={2}>
              <Button
                disabled={actionLoading}
                variant="primary"
                onClick={reloadDictionary}
                style={{ width: "100%" }}
              >
                Reload Dictionary
              </Button>
            </Col>
            <Col md={10}>
              Reloads the ANET Dictionary. After making changes in ANET
              dictionary, reloading the dictionary makes those changes effective
              immediately without restarting the server.
            </Col>
          </Row>
        </Container>
      </Fieldset>
      <Fieldset
        title={getTitleText(recentActivities, "Recent Activities")}
        action={recentActivitiesActionButton}
      >
        <RecentActivityTable
          text="recent activities"
          values={recentActivities}
        />
      </Fieldset>
      <Fieldset
        title={getTitleText(recentUsers, "Recent Users")}
        action={recentActivitiesActionButton}
      >
        <RecentActivityTable text="recent users" values={recentUsers} />
      </Fieldset>
    </div>
  )

  function getTitleText(data, text) {
    return (
      <>
        {text}
        {data ? ` (${data.length || 0})` : ""}
        {lastLoaded && (
          <span style={{ fontSize: "0.7em" }}>
            &nbsp;Fetched @ {lastLoaded.format("HH:mm:ss")}
          </span>
        )}
      </>
    )
  }

  function onSubmit(values, form) {
    // settings as JSON
    const settings = Object.map(values, (key, value) => ({ key, value }))
    return API.mutation(GQL_SAVE_ADMIN_SETTINGS, { settings })
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
    setSaveSuccess("Admin settings saved")
    jumpToTop()
    loadAppData()
    refetch()
  }

  function clearCache() {
    setActionLoading(true)
    return API.query(CLEAR_CACHE, {})
      .then(result =>
        toast.success(result?.clearCache, { toastId: "success-clear-cache" })
      )
      .catch(handleError)
      .finally(() => setActionLoading(false))
  }

  function reloadDictionary() {
    setActionLoading(true)
    return API.query(RELOAD_DICTIONARY, {})
      .then(result => {
        toast.success(result?.reloadDictionary, {
          toastId: "success-reload-dictionary"
        })
        // Clear previous error message
        handleError(null)
      })
      .catch(handleError)
      .finally(() => setActionLoading(false))
  }

  function loadRecentActivities() {
    setActionLoading(true)
    return API.query(RECENT_ACTIVITIES, {})
      .then(data => {
        const byActivity = data?.recentActivities?.byActivity || []
        /*
         * We need a stable identity to be used as Key by react.
         * Since this data is not coming from database it doesn't have a uuid by itself.
         * "listKey" is used by react as stable identity while displaying these as list in RecentActivityTable
         */
        byActivity.forEach(ua => (ua.listKey = uuidv4()))
        setRecentActivities(byActivity)

        const byUser = data?.recentActivities?.byUser || []
        // "listKey" is used by react as stable identity while displaying these as list in RecentActivityTable
        byUser.forEach(ua => (ua.listKey = uuidv4()))
        setRecentUsers(byUser)
        setLastLoaded(moment())
        toast.success(
          "Recent activities & recent users are loaded successfully",
          {
            toastId: "success-load-recent"
          }
        )
      })
      .catch(handleError)
      .finally(() => setActionLoading(false))
  }

  function handleError(error) {
    setSaveError(error)
    setSaveSuccess(null)
    jumpToTop()
  }
}

AdminIndex.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AdminIndex)
