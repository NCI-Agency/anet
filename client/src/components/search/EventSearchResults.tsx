import {
  gqlEntityFieldsMap,
  gqlMinimalEventTypeFields,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import EventTable from "components/EventTable"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_EVENT_LIST = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Event}
        startDate
        endDate
        eventType {
          ${gqlMinimalEventTypeFields}
        }
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        eventSeries {
          ${gqlEntityFieldsMap.EventSeries}
        }
        location {
          ${gqlEntityFieldsMap.Location}
          lat
          lng
          type
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
    extraProps={{
      showEventSeries: true
    }}
  />
)

export default EventSearchResults
