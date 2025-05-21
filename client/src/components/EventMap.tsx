import { gql } from "@apollo/client"
import API from "api"
import EventsMapWidget from "components/aggregations/EventsMapWidget"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import React from "react"
import { connect } from "react-redux"

const GQL_GET_EVENT_LIST = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        type
        name
        startDate
        endDate
        location {
          uuid
          name
          lat
          lng
        }
      }
    }
  }
`

interface EventMapProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  // pass mapId explicitly when you have more than one map on a page (else the default is fine):
  mapId: string
  width?: number | string
  height?: number | string
  marginBottom?: number | string
}

const EventMap = ({
  pageDispatchers,
  queryParams,
  mapId = "events",
  width,
  height,
  marginBottom
}: EventMapProps) => {
  const eventQuery = { ...queryParams, pageSize: 0 }
  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENT_LIST, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }
  const events = data ? data.eventList.list : []
  return (
    <EventsMapWidget
      values={events}
      widgetId={mapId}
      width={width}
      height={height}
      marginBottom={marginBottom}
      whenUnspecified={<em>No events with a location found</em>}
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(EventMap)
