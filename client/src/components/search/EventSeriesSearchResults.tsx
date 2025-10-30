import { gql } from "@apollo/client"
import EventSeriesTable from "components/EventSeriesTable"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_EVENT_SERIES_LIST = gql`
  query ($eventSeriesQuery: EventSeriesSearchQueryInput) {
    eventSeriesList(query: $eventSeriesQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ownerOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        hostOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        adminOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
    tableId="event-series-search-results"
    {...props}
  />
)

export default EventSeriesSearchResults
