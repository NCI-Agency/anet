import { Icon, Intent, Spinner, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { gql } from "apollo-boost"
import Report from "models/Report"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"

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
  const [status, setStatus] = useState("loading")
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!report || !report.uuid || !report.engagementDate) {
      setStatus("done")
      return
    }

    API.query(GET_REPORT_WITH_ATTENDED_REPORTS, {
      uuid: report.uuid,
      attendedReportsQuery: {
        engagementDateStart: moment(report.engagementDate)
          .startOf("day")
          .valueOf(),
        engagementDateEnd: moment(report.engagementDate).endOf("day").valueOf()
      }
    })
      .then(result => {
        setStatus("done")
        setData(result)
      })
      .catch(() => setStatus("error"))
  }, [report])

  if (status === "loading") {
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

  if (status === "error") {
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
