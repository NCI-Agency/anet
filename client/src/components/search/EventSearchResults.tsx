import { gql } from "@apollo/client"
import EventTable from "components/EventTable"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_EVENT_LIST = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        startDate
        endDate
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
        eventSeries {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        location {
          uuid
          name
          lat
          lng
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

const EventSearchResults = (props: GenericSearchResultsProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_EVENT_LIST}
    gqlQueryParamName="eventQuery"
    gqlQueryResultName="eventList"
    tableComponent={EventTable}
    tableResultsProp="events"
    tableId="events-search-results"
    {...props}
  />
)

export default EventSearchResults
