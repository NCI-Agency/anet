import { gql } from "@apollo/client"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import OrganizationTable from "components/OrganizationTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps,
  GQL_EMAIL_ADDRESSES
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_ORGANIZATION_LIST = gql`
  query (
    $organizationQuery: OrganizationSearchQueryInput
    $emailNetwork: String
  ) {
    organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ${GQL_EMAIL_ADDRESSES}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

const OrganizationSearchResults = (
  props: GenericSearchResultsWithEmailProps
) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_ORGANIZATION_LIST}
    gqlQueryParamName="organizationQuery"
    gqlQueryResultName="organizationList"
    tableComponent={OrganizationTable}
    tableResultsProp="organizations"
    tableId="organizations-search-results"
    {...props}
    extraProps={{
      showLocation: true
    }}
  />
)

export default OrganizationSearchResults
