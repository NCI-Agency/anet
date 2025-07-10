import { gql } from "@apollo/client"
import LocationTable from "components/LocationTable"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_LOCATION_LIST = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        lat
        lng
        type
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
