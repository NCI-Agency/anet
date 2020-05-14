import { Icon, Intent, Spinner, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { gql } from "apollo-boost"
import Report from "models/Report"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"

const GET_REPORT_WITH_ATTENDED_REPORTS = gql`
  query($uuid: String, $attendedReportsQuery: ReportSearchQueryInput) {
    report(uuid: $uuid) {
      uuid
      engagementDate
      duration
      attendees {
        uuid
        name
        attendedReports(query: $attendedReportsQuery) {
          list {
            uuid
            engagementDate
            duration
          }
        }
      }
    }
  }
`

const PlanningConflictForReport = ({ report, text, largeIcon }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()
  const [data, setData] = useState()

  /*
   * We cannot use API.useApiQuery here because this component is rendered by
   * ReactDOM.render in ReportCalendar and ReportMap.
   *
   * If the component is unmounted before API.query is resolved or rejected,
   * following warning is printed to the console;
   *
   * Warning: Can't perform a React state update on an unmounted component.
   * This is a no-op, but it indicates a memory leak in your application.
   * To fix, cancel all subscriptions and asynchronous tasks in a useEffect
   * cleanup function.
   *
   * Since there is no way of canceling a Promise, _isMounted is a workaround.
   *
   * https://stackoverflow.com/questions/59780268/cleanup-memory-leaks-on-an-unmounted-component-in-react-hooks
   */
  const _isMounted = useRef(true)

  useEffect(() => {
    if (!report || !report.uuid || !report.engagementDate) {
      setLoading(false)
    } else {
      API.query(GET_REPORT_WITH_ATTENDED_REPORTS, {
        uuid: report.uuid,
        attendedReportsQuery: {
          engagementDateStart: moment(report.engagementDate)
            .startOf("day")
            .valueOf(),
          engagementDateEnd: moment(report.engagementDate)
            .endOf("day")
            .valueOf()
        }
      })
        .then(d => _isMounted.current && setData(d))
        .catch(e => _isMounted.current && setError(e))
        .finally(() => _isMounted.current && setLoading(false))
    }

    return () => (_isMounted.current = false)
  }, [report])

  if (loading) {
    return (
      <span className="reportConflictLoadingIcon">
        <Spinner
          intent={Intent.WARNING}
          size={12}
          style={{ margin: "0 2px" }}
        />
        {text}
      </span>
    )
  }

  if (error) {
    return (
      <Tooltip
        content="An error occured while checking planning conflicts!"
        intent={Intent.DANGER}
      >
        <Icon
          icon={IconNames.ERROR}
          intent={Intent.DANGER}
          iconSize={Icon.SIZE_STANDARD}
        />
      </Tooltip>
    )
  }

  const currentReport = data?.report ? new Report(data.report) : null
  const attendees = currentReport?.attendees || []

  const conflictingAttendees = attendees.filter(at =>
    at.attendedReports.list.some(ar => currentReport.hasConflict(ar))
  )

  if (!conflictingAttendees.length) {
    return text || null
  }

  return (
    <span className="reportConflictIcon">
      <Tooltip
        content={
          <div className="reportConflictTooltipContainer">
            <div>
              {conflictingAttendees.length} of {attendees.length} attendees are
              busy at the selected time!
            </div>
            <ul>
              {conflictingAttendees.map(at => (
                <li key={at.uuid}>{at.name}</li>
              ))}
            </ul>
          </div>
        }
        intent={Intent.WARNING}
      >
        <Icon
          icon={IconNames.WARNING_SIGN}
          intent={Intent.WARNING}
          iconSize={largeIcon ? Icon.SIZE_LARGE : Icon.SIZE_STANDARD}
          style={{ margin: "0 5px" }}
        />
      </Tooltip>
      {text}
    </span>
  )
}

PlanningConflictForReport.propTypes = {
  report: PropTypes.instanceOf(Report).isRequired,
  text: PropTypes.string,
  largeIcon: PropTypes.bool
}

PlanningConflictForReport.defaultProps = {
  text: ""
}

export default PlanningConflictForReport
