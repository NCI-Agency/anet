import API from "api"
import EventsMapWidget from "components/aggregations/EventsMapWidget"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { Event } from "models"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { connect } from "react-redux"

const EventMap = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  mapId,
  width,
  height,
  marginBottom
}) => {
  const eventQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(Event.getEventListQuery, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.eventList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
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

EventMap.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  // pass mapId explicitly when you have more than one map on a page (else the default is fine):
  mapId: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

EventMap.defaultProps = {
  mapId: "events"
}
export default connect(null, mapPageDispatchersToProps)(EventMap)
