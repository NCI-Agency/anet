import {
  gqlEmailAddressesForNetworkFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import OrganizationTable from "components/OrganizationTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_ORGANIZATION_LIST = gql`
  query (
    $organizationQuery: OrganizationSearchQueryInput
    $emailNetwork: String
  ) {
    organizationList(query: $organizationQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Organization}
        ${gqlEmailAddressesForNetworkFields}
        location {
          ${gqlEntityFieldsMap.Location}
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
