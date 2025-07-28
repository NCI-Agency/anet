import { gql } from "@apollo/client"
import API from "api"
import {
  createCalendarEventFromReport,
  eventsToCalendarEvents
} from "components/aggregations/utils"
import Calendar from "components/Calendar"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import { ATTENDEE_TYPE_INTERLOCUTOR } from "components/ReportCalendar"
import _isEqual from "lodash/isEqual"
import moment from "moment"
import React, { useRef } from "react"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"

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
        reports {
          uuid
          intent
          primaryAdvisor {
            uuid
            name
          }
          primaryInterlocutor {
            uuid
            name
          }
          advisorOrg {
            uuid
            shortName
            longName
            identificationCode
          }
          interlocutorOrg {
            uuid
            shortName
            longName
            identificationCode
          }
          engagementDate
          duration
          state
          location {
            uuid
            name
            lat
            lng
          }
        }
      }
    }
  }
`

interface EventCalendarProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  attendeeType: string
}

const EventCalendar = ({
  pageDispatchers: { showLoading, hideLoading },
  queryParams,
  attendeeType
}: EventCalendarProps) => {
  const navigate = useNavigate()
  const prevEventQuery = useRef(null)
  const prevAttendeeType = useRef(null)
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
      if (prevAttendeeType.current !== attendeeType) {
        // Only attendeeType changed, just recompute the reports
        prevAttendeeType.current = attendeeType
        showLoading()
        apiPromise.current = apiPromise.current.then(data => {
          // Extended props contains both events and reports
          const results = data.map(d =>
            d.extendedProps.engagementDate
              ? createCalendarEventFromReport(
                  d.extendedProps,
                  attendeeType === ATTENDEE_TYPE_INTERLOCUTOR
                )
              : d
          )
          hideLoading()
          return results
        })
      }
      // Optimise, return API promise instead of calling API.query again
      return apiPromise.current
    }
    prevEventQuery.current = eventQuery
    prevAttendeeType.current = attendeeType
    // Store API promise to use in optimised case
    showLoading()
    apiPromise.current = API.query(GQL_GET_EVENT_LIST, {
      eventQuery
    }).then(data => {
      const events = data ? data.eventList.list : []
      const results = eventsToCalendarEvents(
        events,
        attendeeType === ATTENDEE_TYPE_INTERLOCUTOR
      )
      hideLoading()
      return results
    })
    return apiPromise.current
  }
}

export default connect(null, mapPageDispatchersToProps)(EventCalendar)
