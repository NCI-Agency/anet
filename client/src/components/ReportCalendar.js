import API, { Settings } from "api"
import { gql } from "apollo-boost"
import Calendar from "components/Calendar"
import { mapDispatchToProps, usePrevious } from "components/Page"
import _isEqual from "lodash/isEqual"
import { Person, Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import { connect } from "react-redux"
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

const ReportCalendar = props => {
  const { queryParams, setTotalCount } = props
  const prevQueryParams = usePrevious(queryParams)
  const history = useHistory()
  const engagementDateRange = useRef(null)
  const calendarComponentRef = useRef(null)
  const events = useRef([])

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
    const newEngagementDateRange = [
      moment(fetchInfo.start).startOf("day"),
      moment(fetchInfo.end).endOf("day")
    ]
    if (_isEqual(engagementDateRange.current, newEngagementDateRange)) {
      if (_isEqual(queryParams, prevQueryParams)) {
        return events.current
      }
    } else {
      engagementDateRange.current = newEngagementDateRange
    }
    const reportQuery = Object.assign({}, queryParams, {
      pageSize: 0,
      engagementDateStart: newEngagementDateRange[0],
      engagementDateEnd: newEngagementDateRange[1]
    })
    API.query(GQL_GET_REPORT_LIST, {
      reportQuery
    }).then(data => {
      const reports = data ? data.reportList.list : []
      if (setTotalCount) {
        const { totalCount } = data.reportList
        setTotalCount(totalCount)
      }
      events.current = reports.map(r => {
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
          classNames: ["event-" + r.state.toLowerCase()],
          extendedProps: { ...r },
          allDay:
            !Settings.engagementsIncludeTimeAndDuration || r.duration === null
        }
      })
      successCallback(events.current)
    })
  }
}

ReportCalendar.propTypes = {
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func
}

export default connect(
  null,
  mapDispatchToProps
)(ReportCalendar)
