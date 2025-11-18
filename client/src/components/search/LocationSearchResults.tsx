import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import LocationTable from "components/LocationTable"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_LOCATION_LIST = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
    }
  }
`

const LocationSearchResults = (props: GenericSearchResultsProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_LOCATION_LIST}
    gqlQueryParamName="locationQuery"
    gqlQueryResultName="locationList"
    tableComponent={LocationTable}
    tableResultsProp="locations"
    tableId="locations-search-results"
    {...props}
  />
)

export default LocationSearchResults
