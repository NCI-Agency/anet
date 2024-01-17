import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import React from "react"
import { connect } from "react-redux"

const GQL_GET_MY_AUTHORIZATION_GROUPS = gql`
  query {
    me {
      uuid
      position {
        authorizationGroupsAdministrated {
          uuid
          name
          description
          status
          authorizationGroupRelatedObjects {
            relatedObjectType
            relatedObjectUuid
            relatedObject {
              ... on Organization {
                uuid
                shortName
                longName
                identificationCode
              }
              ... on Person {
                uuid
                name
                rank
                avatarUuid
              }
              ... on Position {
                uuid
                type
                name
              }
            }
          }
        }
      }
    }
  }
`

const MyAuthorizationGroups = ({ pageDispatchers }) => {
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_MY_AUTHORIZATION_GROUPS
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("My Authorization Groups")
  if (done) {
    return result
  }

  const authorizationGroupsAdministrated =
    data?.me?.position?.authorizationGroupsAdministrated || []

  return (
    <div>
      <Fieldset
        id="my-authorization-groups"
        title="Authorization Groups I administrate"
      >
        <AuthorizationGroupTable
          authorizationGroups={authorizationGroupsAdministrated}
        />
      </Fieldset>
    </div>
  )
}

MyAuthorizationGroups.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(MyAuthorizationGroups)
