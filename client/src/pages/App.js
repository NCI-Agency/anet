import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import ResponsiveLayout from "components/ResponsiveLayout"
import { Organization, Person } from "models"
import { GET_NOTIFICATIONS_NOTES, useNotifications } from "notificationsUtils"
import Routing from "pages/Routing"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { Redirect } from "react-router"
import { useHistory, useLocation } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ReactTooltip from "react-tooltip"
import "../components/reactToastify.css"

const GQL_GET_APP_DATA = gql`
  query {
    me {
      uuid
      name
      rank
      role
      emailAddress
      status
      avatar(size: 32)
      code
      position {
        uuid
        name
        code
        type
        status
        isApprover
        organization {
          uuid
          shortName
          descendantOrgs {
            uuid
          }
        }
        location {
          uuid
          name
        }
        associatedPositions {
          uuid
          name
          person {
            uuid
            name
            rank
            avatar(size: 32)
            position {
              uuid
              name
              code
              type
              organization {
                uuid
                shortName
              }
              location {
                uuid
                name
              }
            }
          ${GET_NOTIFICATIONS_NOTES}
          }
          organization {
            uuid
            shortName
          }
        }
      }
    }

    adminSettings {
      key
      value
    }

    topLevelAdvisorOrgs: organizationList(
      query: {
        pageSize: 0
        hasParentOrg: false
        status: ACTIVE
        type: ADVISOR_ORG
      }
    ) {
      list {
        uuid
        shortName
      }
    }

    topLevelPrincipalOrgs: organizationList(
      query: {
        pageSize: 0
        hasParentOrg: false
        status: ACTIVE
        type: PRINCIPAL_ORG
      }
    ) {
      list {
        uuid
        shortName
      }
    }
  }
`

const App = ({ pageDispatchers, pageProps }) => {
  const history = useHistory()
  const routerLocation = useLocation()
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_APP_DATA)

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps,
    pageDispatchers
  })
  const skip = done || error || !data
  const appState = skip ? null : processData(data)
  const [notifications, loadingNotifications] = useNotifications(
    appState?.currentUser,
    skip
  )

  if (done) {
    return result
  }
  if (loadingNotifications) {
    // FIXME: need this otherwise, 404 tests breaks, how can we combine appData + notifications data and loading processes
    return <div className="loader" />
  }

  if (!data) {
    return <Messages error={{ message: "Could not load initial data" }} />
  }

  // if this is a new user, redirect to onboarding
  if (
    appState.currentUser.isNewUser() &&
    !routerLocation.pathname.startsWith("/onboarding")
  ) {
    return <Redirect to="/onboarding" />
  }

  return (
    <AppContext.Provider
      value={{
        appSettings: appState.settings,
        currentUser: appState.currentUser,
        loadAppData: refetch,
        notifications
      }}
    >
      <ResponsiveLayout
        pageProps={pageProps}
        pageHistory={history}
        location={routerLocation}
        sidebarData={{
          advisorOrganizations: appState.advisorOrganizations,
          principalOrganizations: appState.principalOrganizations
        }}
      >
        <ToastContainer />
        <ReactTooltip id="tooltip-top" place="top" className="tooltip-top" />
        <Routing />
      </ResponsiveLayout>
    </AppContext.Provider>
  )

  function processData(data) {
    function sortOrganizations(organizations) {
      organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))
    }

    function getSortedOrganizationsFromData(organizationsData) {
      let organizations = (organizationsData && organizationsData.list) || []
      organizations = Organization.fromArray(organizations)
      sortOrganizations(organizations)
      return organizations
    }

    const currentUser = new Person(data.me)
    const advisorOrganizations = getSortedOrganizationsFromData(
      data.topLevelAdvisorOrgs
    )
    const principalOrganizations = getSortedOrganizationsFromData(
      data.topLevelPrincipalOrgs
    )
    const settings = {}
    data.adminSettings.forEach(
      setting => (settings[setting.key] = setting.value)
    )

    return {
      currentUser,
      settings,
      advisorOrganizations,
      principalOrganizations
    }
  }
}

App.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  pageProps: PropTypes.object
}

const mapStateToProps = (state, ownProps) => ({
  pageProps: state.pageProps
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(App)
