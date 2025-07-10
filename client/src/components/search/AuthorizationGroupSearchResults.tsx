import { gql } from "@apollo/client"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps,
  GQL_EMAIL_ADDRESSES
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_AUTHORIZATION_GROUP_LIST = gql`
  query (
    $authorizationGroupQuery: AuthorizationGroupSearchQueryInput
    $emailNetwork: String
  ) {
    authorizationGroupList(query: $authorizationGroupQuery) {
      pageNum
      pageSize
      totalCount
      list {
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
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Person {
              uuid
              name
              rank
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Position {
              uuid
              type
              name
              ${GQL_EMAIL_ADDRESSES}
            }
          }
        }
      }
    }
  }
`

const AuthorizationGroupSearchResults = (
  props: GenericSearchResultsWithEmailProps
) => {
  return (
    <CommonSearchResults
      gqlQuery={GQL_GET_AUTHORIZATION_GROUP_LIST}
      gqlQueryParamName="authorizationGroupQuery"
      gqlQueryResultName="authorizationGroupList"
      tableComponent={AuthorizationGroupTable}
      tableResultsProp="authorizationGroups"
      tableId="authorizationGroups-search-results"
      getListWithEmailAddresses={getListWithEmailAddresses}
      {...props}
      extraProps={{
        showMembers: true,
        showStatus: true
      }}
    />
  )

  function getListWithEmailAddresses(list) {
    return list.map(ag => ({
      uuid: ag.uuid,
      emailAddresses: ag.authorizationGroupRelatedObjects
        .flatMap(agro => agro.relatedObject?.emailAddresses)
        .filter(Boolean)
    }))
  }
}

export default AuthorizationGroupSearchResults
