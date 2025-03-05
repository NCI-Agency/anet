import { gql } from "@apollo/client"
import API from "api"
import { reportsToEvents } from "components/aggregations/utils"
import Calendar from "components/Calendar"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import { PageDispatchersPropType } from "components/Page"
import _isEqual from "lodash/isEqual"
import moment from "moment"
import React, { useRef } from "react"
import { useNavigate } from "react-router-dom"

export const ATTENDEE_TYPE_ADVISOR = "advisor"
export const ATTENDEE_TYPE_INTERLOCUTOR = "interlocutor"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        interlocutorOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
`

interface ReportCalendarProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  attendeeType: string
  event?: Event
}

const ReportCalendar = ({
  pageDispatchers: { showLoading, hideLoading },
  queryParams,
  setTotalCount,
  attendeeType,
  event
}: ReportCalendarProps) => {
  const navigate = useNavigate()
  const prevReportQuery = useRef(null)
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
    const reportQuery = Object.assign({}, queryParams, {
      pageSize: 0,
      engagementDateStart: moment(fetchInfo.start).startOf("day"),
      engagementDateEnd: moment(fetchInfo.end).endOf("day")
    })
    if (_isEqual(prevReportQuery.current, reportQuery)) {
      if (prevAttendeeType.current !== attendeeType) {
        // Only attendeeType changed, just recompute events
        prevAttendeeType.current = attendeeType
        showLoading()
        apiPromise.current = apiPromise.current.then(data => {
          // Each report is stored in the extendedProps
          const reports = data.map(d => d.extendedProps)
          const results = reportsToEvents(
            reports,
            attendeeType === ATTENDEE_TYPE_INTERLOCUTOR,
            event
          )
          hideLoading()
          return results
        })
      }
      // Optimise, return API promise instead of calling API.query again
      return apiPromise.current
    }
    prevReportQuery.current = reportQuery
    prevAttendeeType.current = attendeeType
    if (setTotalCount) {
      // Reset the total count
      setTotalCount(null)
    }
    // Store API promise to use in optimised case
    showLoading()
    apiPromise.current = API.query(GQL_GET_REPORT_LIST, {
      reportQuery
    }).then(data => {
      const reports = data ? data.reportList.list : []
      if (setTotalCount) {
        const { totalCount } = data.reportList
        setTotalCount(totalCount)
      }
      const results = reportsToEvents(
        reports,
        attendeeType === ATTENDEE_TYPE_INTERLOCUTOR,
        event
      )
      hideLoading()
      return results
    })
    return apiPromise.current
  }
}

export default ReportCalendar
