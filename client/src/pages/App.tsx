import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import Messages from "components/Messages"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import "components/previews/RegisterPreviewComponents"
import ResponsiveLayout from "components/ResponsiveLayout"
import { Organization, Person } from "models"
import {
  getNotifications,
  GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS
} from "notificationsUtils"
import Routing from "pages/Routing"
import { usePollingRequest } from "pollingUtils"
import React from "react"
import { connect } from "react-redux"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import { D3Tooltip } from "../components/D3Tooltip"
import "../components/D3Tooltip.css"

const GQL_GET_APP_DATA = gql`
  query {
    me {
      uuid
      name
      rank
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      status
      pendingVerification
      code
      preferences {
        uuid
        preference {
          uuid
          name
        }
        person {
          uuid
        }
        value
      }
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
        superuserType
        role
        status
        isApprover
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        associatedPositions {
          uuid
          name
          code
          type
          role
          status
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          location {
            uuid
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            position {
              uuid
              name
              type
              role
              code
              status
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
            ${GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS}
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
          descendantTasks {
            uuid
          }
          ${GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS}
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
      previousPositions {
        startTime
        endTime
        position {
          uuid
          name
          code
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
      }
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
        app6standardIdentity
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
    }
  }
`

interface AppProps {
  pageDispatchers?: PageDispatchersPropType
  pageProps?: any
}

const App = ({ pageDispatchers, pageProps }: AppProps) => {
  const navigate = useNavigate()
  const routerLocation = useLocation()

  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_APP_DATA)
  const { adminSettings, ...connectionInfo } = usePollingRequest()
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
        appSettings: adminSettings,
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
    const currentUser = new Person(data.me)
    const notifications = getNotifications(currentUser.position)
    return {
      currentUser,
      allOrganizations,
      notifications
    }
  }
}

const mapStateToProps = state => ({
  pageProps: state.pageProps
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(App)
