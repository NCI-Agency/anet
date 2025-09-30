import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import Fieldset from "components/Fieldset"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
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
          distributionList
          forSensitiveInformation
          authorizationGroupRelatedObjects {
            relatedObjectType
            relatedObjectUuid
            relatedObject {
              ... on Organization {
                uuid
                shortName
                longName
                identificationCode
                ${GRAPHQL_ENTITY_AVATAR_FIELDS}
              }
              ... on Person {
                uuid
                name
                rank
                ${GRAPHQL_ENTITY_AVATAR_FIELDS}
              }
              ... on Position {
                uuid
                type
                name
                ${GRAPHQL_ENTITY_AVATAR_FIELDS}
              }
            }
          }
        }
      }
    }
  }
`

interface MyAuthorizationGroupsProps {
  pageDispatchers?: PageDispatchersPropType
}

const MyAuthorizationGroups = ({
  pageDispatchers
}: MyAuthorizationGroupsProps) => {
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
  usePageTitle("My Communities")
  if (done) {
    return result
  }

  const authorizationGroupsAdministrated =
    data?.me?.position?.authorizationGroupsAdministrated || []

  return (
    <div>
      <Fieldset id="my-authorization-groups" title="Communities I administrate">
        <AuthorizationGroupTable
          authorizationGroups={authorizationGroupsAdministrated}
          showDistributionList
          showForSensitiveInformation
          showMembers
          showStatus
        />
      </Fieldset>
    </div>
  )
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(MyAuthorizationGroups)
