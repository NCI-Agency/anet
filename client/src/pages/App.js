import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Messages from "components/Messages"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import ResponsiveLayout from "components/ResponsiveLayout"
import { Organization, Person } from "models"
import Routing from "pages/Routing"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { Redirect } from "react-router"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
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

    organizationTopLevelOrgs(type: ADVISOR_ORG) {
      list {
        uuid
        shortName
      }
    }
  }
`

const App = props => {
  let appState = processData(window.ANET_DATA)
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_APP_DATA)
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  if (error || !data) {
    return (
      <Messages error={error || { message: "Could not load initial data" }} />
    )
  }
  appState = processData(data)
  // if this is a new user, redirect to onboarding
  if (
    appState.currentUser.isNewUser() &&
    !props.location.pathname.startsWith("/onboarding")
  ) {
    return <Redirect to="/onboarding" />
  }

  const { pageProps, history, location } = props

  return (
    <AppContext.Provider
      value={{
        appSettings: appState.settings,
        currentUser: appState.currentUser,
        loadAppData: refetch
      }}
    >
      <ResponsiveLayout
        pageProps={pageProps}
        pageHistory={history}
        location={location}
        sidebarData={appState.organizations}
      >
        <ToastContainer />
        <Routing />
      </ResponsiveLayout>
    </AppContext.Provider>
  )

  function processData(data) {
    const currentUser = new Person(data.me)
    let organizations =
      (data.organizationTopLevelOrgs && data.organizationTopLevelOrgs.list) ||
      []
    organizations = Organization.fromArray(organizations)
    organizations.sort((a, b) => a.shortName.localeCompare(b.shortName))

    let settings = {}
    data.adminSettings.forEach(
      setting => (settings[setting.key] = setting.value)
    )

    return { currentUser, settings, organizations }
  }
}

App.propTypes = {
  ...pagePropTypes,
  pageProps: PropTypes.object
}

const mapStateToProps = (state, ownProps) => ({
  pageProps: state.pageProps
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
