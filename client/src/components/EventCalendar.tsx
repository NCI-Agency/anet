import API from "api"
import { eventsToCalendarEvents } from "components/aggregations/utils"
import Calendar from "components/Calendar"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import _isEqual from "lodash/isEqual"
import { Event } from "models"
import moment from "moment"
import React, { useRef } from "react"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"

interface EventCalendarProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const EventCalendar = ({
  pageDispatchers: { showLoading, hideLoading },
  queryParams
}: EventCalendarProps) => {
  const navigate = useNavigate()
  const prevEventQuery = useRef(null)
  const apiPromise = useRef(null)
  const calendarComponentRef = useRef(null)
  return (
    <Calendar
      events={getEvents}
      eventClick={info => {
        navigate(info.event.url)
        // Prevent browser navigation to the url
        info.jsEvent.preventDefault()
      }}
      calendarComponentRef={calendarComponentRef}
    />
  )

  function getEvents(fetchInfo, successCallback, failureCallback) {
    const eventQuery = {
      ...queryParams,
      status: Model.STATUS.ACTIVE,
      pageSize: 0,
      startDate: moment(fetchInfo.start).startOf("day"),
      endDate: moment(fetchInfo.end).endOf("day")
    }
    if (_isEqual(prevEventQuery.current, eventQuery)) {
      // Optimise, return API promise instead of calling API.query again
      return apiPromise.current
    }
    prevEventQuery.current = eventQuery
    // Store API promise to use in optimised case
    showLoading()
    apiPromise.current = API.query(Event.getEventListQuery, {
      eventQuery
    }).then(data => {
      const events = data ? data.eventList.list : []
      const results = eventsToCalendarEvents(events)
      hideLoading()
      return results
    })
    return apiPromise.current
  }
}

export default connect(null, mapPageDispatchersToProps)(EventCalendar)
