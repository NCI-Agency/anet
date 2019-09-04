import API, { Settings } from "api"
import { gql } from "apollo-boost"
import Calendar from "components/Calendar"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import { Person, Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"

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
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const reports = data ? data.reportList.list : []
  if (setTotalCount) {
    const { totalCount } = data.reportList
    setTotalCount(totalCount)
  }
  const calendarComponentRef = React.createRef()
  const events = reports.map(r => {
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
      allDay: !Settings.engagementsIncludeTimeAndDuration || r.duration === null
    }
  })

  return (
    <Calendar events={events} calendarComponentRef={calendarComponentRef} />
  )
}

ReportCalendar.propTypes = {
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func
}

export default connect(
  null,
  mapDispatchToProps
)(ReportCalendar)
