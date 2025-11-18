import {
  gqlBasicPersonFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlPreferenceFields
} from "constants/GraphQLDefinitions"
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
      ${gqlBasicPersonFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      preferences {
        preference {
          ${gqlPreferenceFields}
        }
        value
      }
      authorizationGroups {
        ${gqlEntityFieldsMap.AuthorizationGroup}
      }
      position {
        ${gqlEntityFieldsMap.Position}
        type
        superuserType
        role
        isApprover
        authorizationGroupsAdministrated {
          ${gqlEntityFieldsMap.AuthorizationGroup}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
          descendantOrgs {
            ${gqlEntityFieldsMap.Organization}
          }
        }
        location {
          ${gqlEntityFieldsMap.Location}
        }
        associatedPositions {
          ${gqlEntityFieldsMap.Position}
          organization {
            ${gqlEntityFieldsMap.Organization}
          }
          location {
            ${gqlEntityFieldsMap.Location}
          }
          person {
            ${gqlEntityFieldsMap.Person}
            position {
              ${gqlEntityFieldsMap.Position}
              organization {
                ${gqlEntityFieldsMap.Organization}
              }
              location {
                ${gqlEntityFieldsMap.Location}
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
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
          ascendantTasks {
            ${gqlEntityFieldsMap.Task}
            parentTask {
              ${gqlEntityFieldsMap.Task}
            }
          }
          descendantTasks {
            ${gqlEntityFieldsMap.Task}
          }
          ${GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS}
        }
        organizationsAdministrated {
          ${gqlEntityFieldsMap.Organization}
          descendantOrgs {
            ${gqlEntityFieldsMap.Organization}
          }
        }
        authorizationGroupsAdministrated {
          ${gqlEntityFieldsMap.AuthorizationGroup}
        }
      }
      previousPositions {
        startTime
        endTime
        position {
          ${gqlEntityFieldsMap.Position}
          organization {
            ${gqlEntityFieldsMap.Organization}
          }
          location {
            ${gqlEntityFieldsMap.Location}
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
        ${gqlEntityFieldsMap.Organization}
        app6standardIdentity
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
