import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import EventSeriesTable from "components/EventSeriesTable"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_EVENT_SERIES_LIST = gql`
  query ($eventSeriesQuery: EventSeriesSearchQueryInput) {
    eventSeriesList(query: $eventSeriesQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.EventSeries}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
      }
    }
  }
`

const EventSeriesSearchResults = (props: GenericSearchResultsProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_EVENT_SERIES_LIST}
    gqlQueryParamName="eventSeriesQuery"
    gqlQueryResultName="eventSeriesList"
    tableComponent={EventSeriesTable}
    tableResultsProp="eventSeries"
    tableId="eventSeries-search-results"
    {...props}
  />
)

export default EventSeriesSearchResults
