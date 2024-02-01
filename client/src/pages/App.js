import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import "components/previews/RegisterPreviewComponents"
import ResponsiveLayout from "components/ResponsiveLayout"
import { useConnectionInfo } from "connectionUtils"
import { Organization, Person } from "models"
import {
  getNotifications,
  GRAPHQL_NOTIFICATIONS_NOTE_FIELDS
} from "notificationsUtils"
import Routing from "pages/Routing"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { D3Tooltip } from "../components/D3Tooltip"
import "../components/D3Tooltip.css"
import "../components/reactToastify.css"

const GQL_GET_APP_DATA = gql`
  query {
    me {
      uuid
      name
      rank
      avatarUuid
      status
      emailAddress
      pendingVerification
      code
      emailAddresses {
        network
        address
      }
      authorizationGroups {
        uuid
      }
      position {
        uuid
        name
        code
        type
        role
        status
        isApprover
        authorizationGroupsAdministrated {
          uuid
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
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
          code
          type
          role
          status
          organization {
            uuid
            shortName
            longName
            identificationCode
          }
          location {
            uuid
            name
          }
          person {
            uuid
            name
            rank
            avatarUuid
            position {
              uuid
              name
              type
              role
              code
              status
              organization {
                uuid
                shortName
                longName
                identificationCode
              }
              location {
                uuid
                name
              }
            }
            ${GRAPHQL_NOTIFICATIONS_NOTE_FIELDS}
          }
        }
        responsibleTasks(
          query: {
            status: ACTIVE
          }
        ) {
          uuid
          shortName
          longName
          parentTask {
            uuid
            shortName
          }
          ascendantTasks {
            uuid
            shortName
            parentTask {
              uuid
            }
          }
          ${GRAPHQL_NOTIFICATIONS_NOTE_FIELDS}
        }
        organizationsAdministrated {
          uuid
          descendantOrgs {
            uuid
          }
        }
        authorizationGroupsAdministrated {
          uuid
        }
      }
    }

    adminSettings {
      key
      value
    }

    topLevelOrgs: organizationList(
      query: {
        pageSize: 0
        hasParentOrg: false
        status: ACTIVE
      }
    ) {
      list {
        uuid
        shortName
        longName
        identificationCode
      }
    }
  }
`

const App = ({ pageDispatchers, pageProps }) => {
  const navigate = useNavigate()
  const routerLocation = useLocation()

  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_APP_DATA)
  const connectionInfo = useConnectionInfo()
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps,
    pageDispatchers
  })

  if (done) {
    return result
  }

  if (!data) {
    return <Messages error={{ message: "Could not load initial data" }} />
  }
  const appState = processData(data)

  // if this is a new user, redirect to onboarding
  if (
    appState.currentUser.isPendingVerification() &&
    !routerLocation.pathname.startsWith("/onboarding")
  ) {
    return <Navigate replace to="/onboarding/new" />
  }
  return (
    <AppContext.Provider
      value={{
        appSettings: appState.settings,
        currentUser: appState.currentUser,
        loadAppData: refetch,
        notifications: appState.notifications,
        connection: { ...connectionInfo }
      }}
    >
      <ResponsiveLayout
        pageProps={pageProps}
        pageHistory={navigate}
        location={routerLocation}
        sidebarData={{
          allOrganizations: appState.allOrganizations
        }}
      >
        <ToastContainer theme="colored" />
        <D3Tooltip />
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

    const allOrganizations = getSortedOrganizationsFromData(data.topLevelOrgs)
    const settings = {}
    data.adminSettings.forEach(
      setting => (settings[setting.key] = setting.value)
    )

    const currentUser = new Person(data.me)
    const notifications = getNotifications(currentUser.position)
    return {
      currentUser,
      settings,
      allOrganizations,
      notifications
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
