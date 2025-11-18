import {
  gqlEmailAddressesForNetworkFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import PositionTable from "components/PositionTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_POSITION_LIST = gql`
  query ($positionQuery: PositionSearchQueryInput, $emailNetwork: String) {
    positionList(query: $positionQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Position}
        type
        role
        ${gqlEmailAddressesForNetworkFields}
        location {
          ${gqlEntityFieldsMap.Location}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
    }
  }
`

const PositionSearchResults = (props: GenericSearchResultsWithEmailProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_POSITION_LIST}
    gqlQueryParamName="positionQuery"
    gqlQueryResultName="positionList"
    tableComponent={PositionTable}
    tableResultsProp="positions"
    tableId="positions-search-results"
    {...props}
    extraProps={{
      showLocation: true
    }}
  />
)

export default PositionSearchResults
