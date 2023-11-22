import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

const GQL_GET_AUTHORIZATION_GROUP_LIST = gql`
  query ($query: AuthorizationGroupSearchQueryInput) {
    authorizationGroupList(query: $query) {
      list {
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
            }
            ... on Person {
              uuid
              name
              rank
              role
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
`

const AuthorizationGroups = ({ pageDispatchers }) => {
  const query = {
    pageSize: 0 // retrieve all
  }
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_AUTHORIZATION_GROUP_LIST,
    {
      query
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Authorization Groups")
  if (done) {
    return result
  }

  const authorizationGroups = data ? data.authorizationGroupList.list : []

  return (
    <div>
      <Fieldset title="Authorization Groups">
        <AuthorizationGroupTable authorizationGroups={authorizationGroups} />
      </Fieldset>
    </div>
  )
}

AuthorizationGroups.propTypes = { pageDispatchers: PageDispatchersPropType }

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroups)
