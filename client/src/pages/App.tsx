import {
  gqlBasicPersonFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlPreferenceFields,
  gqlPreviousPositionsFields
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
import { Organization, Person } from "models"
import {
  getNotifications,
  GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS
} from "notificationsUtils"
import routes from "pages/Routing"
import React, { useMemo } from "react"
import { connect } from "react-redux"
import { createBrowserRouter, RouterProvider } from "react-router"
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
        ${gqlPreviousPositionsFields}
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

const router = createBrowserRouter(routes)

function sortOrganizations(organizations) {
  organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))
}

function getSortedOrganizationsFromData(organizationsData) {
  let organizations = organizationsData?.list || []
  organizations = Organization.fromArray(organizations)
  sortOrganizations(organizations)
  return organizations
}

function processData(data) {
  if (!data) {
    return {}
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

interface AppProps {
  pageDispatchers?: PageDispatchersPropType
  pageProps?: any
}

const App = ({ pageDispatchers, pageProps }: AppProps) => {
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_APP_DATA)
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps,
    pageDispatchers
  })
  const appState = processData(data)
  const appContext = useMemo(
    () => ({
      currentUser: appState.currentUser,
      allOrganizations: appState.allOrganizations,
      loadAppData: refetch,
      notifications: appState.notifications
    }),
    [
      appState.allOrganizations,
      appState.currentUser,
      appState.notifications,
      refetch
    ]
  )

  if (done) {
    return result
  }

  if (!data) {
    return <Messages error={{ message: "Could not load initial data" }} />
  }

  return (
    <AppContext.Provider value={appContext}>
      <ToastContainer theme="colored" />
      <D3Tooltip />
      <RouterProvider router={router} unstable_useTransitions={false} />
    </AppContext.Provider>
  )
}

const mapStateToProps = state => ({
  pageProps: state.pageProps
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(App)
