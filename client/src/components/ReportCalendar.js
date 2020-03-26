import API, { Settings } from "api"
import { gql } from "apollo-boost"
import Calendar from "components/Calendar"
import { PageDispatchersPropType } from "components/Page"
import _isEqual from "lodash/isEqual"
import { Person, Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import { useHistory } from "react-router-dom"

const GQL_GET_REPORT_LIST = gql`
  query($reportQuery: ReportSearchQueryInput) {
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
        principalOrg {
          uuid
          shortName
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

const ReportCalendar = ({
  pageDispatchers: { showLoading, hideLoading },
  queryParams,
  setTotalCount
}) => {
  const history = useHistory()
  const prevReportQuery = useRef(null)
  const apiPromise = useRef(null)
  const calendarComponentRef = useRef(null)

  return (
    <Calendar
      events={getEvents}
      eventClick={info => {
        history.push(info.event.url)
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
      // Optimise, return previous API promise instead of calling API.query again
      return apiPromise.current
    }
    prevReportQuery.current = reportQuery
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
      const results = reports.map(r => {
        const who =
          (r.primaryAdvisor && new Person(r.primaryAdvisor).toString()) || ""
        const where =
          (r.principalOrg && r.principalOrg.shortName) ||
          (r.location && r.location.name) ||
          ""

        return {
          title: who + "@" + where,
          start: moment(r.engagementDate).format("YYYY-MM-DD HH:mm"),
          end: moment(r.engagementDate)
            .add(r.duration, "minutes")
            .format("YYYY-MM-DD HH:mm"),
          url: Report.pathFor(r),
          classNames: [`event-${Report.getStateForClassName(r)}`],
          extendedProps: { ...r },
          allDay:
            !Settings.engagementsIncludeTimeAndDuration || r.duration === null
        }
      })
      hideLoading()
      return results
    })
    return apiPromise.current
  }
}

ReportCalendar.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func
}

export default ReportCalendar
