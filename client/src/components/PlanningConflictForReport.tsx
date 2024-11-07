import { gql } from "@apollo/client"
import { Icon, IconSize, Intent, Spinner, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import API from "api"
import { Report } from "models"
import moment from "moment"
import React from "react"

const GET_REPORT_WITH_ATTENDED_REPORTS = gql`
  query ($uuid: String, $attendedReportsQuery: ReportSearchQueryInput) {
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

interface PlanningConflictForReportProps {
  report: any
  text?: string
  largeIcon?: boolean
}

const PlanningConflictForReport = ({
  report,
  text = "",
  largeIcon
}: PlanningConflictForReportProps) => {
  const { loading, error, data } = API.useApiQuery(
    GET_REPORT_WITH_ATTENDED_REPORTS,
    {
      uuid: report.uuid,
      attendedReportsQuery: {
        state: Object.values(Report.STATE),
        engagementDateStart: moment(report.engagementDate)
          .startOf("day")
          .valueOf(),
        engagementDateEnd: moment(report.engagementDate).endOf("day").valueOf()
      }
    }
  )

  if (loading) {
    return (
      <ReportConflictLoadingIconBox className="reportConflictLoadingIcon">
        <Spinner
          intent={Intent.WARNING}
          size={12}
          style={{ margin: "0 2px" }}
        />
        {text}
      </ReportConflictLoadingIconBox>
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
          size={IconSize.STANDARD}
        />
      </Tooltip>
    )
  }

  const currentReport = data?.report ? new Report(data.report) : null
  const attendees = currentReport?.attendees || []

  const conflictingAttendees = attendees.filter(at =>
    at.attendedReports.list.some(ar => Report.hasConflict(currentReport, ar))
  )

  if (!conflictingAttendees.length) {
    return text || null
  }

  return (
    <ReportConflictIconBox className="reportConflictIcon">
      <Tooltip
        content={
          <ReportConflictTooltipContainer className="reportConflictTooltipContainer">
            <div>
              {conflictingAttendees.length} of {attendees.length} attendees are
              busy at the selected time!
            </div>
            <ul>
              {conflictingAttendees.map(at => (
                <li key={at.uuid}>{at.name}</li>
              ))}
            </ul>
          </ReportConflictTooltipContainer>
        }
        intent={Intent.WARNING}
      >
        <Icon
          icon={IconNames.WARNING_SIGN}
          intent={Intent.WARNING}
          size={largeIcon ? IconSize.LARGE : IconSize.STANDARD}
          style={{ margin: "0 5px" }}
        />
      </Tooltip>
      {text}
    </ReportConflictIconBox>
  )
}

/** wdio e2e tests rely on these class names
 *
 * .reportConflictIcon, .reportConflictLoadingIcon, .reportConflictTooltipContainer
 *
 */

const ReportConflictIconBox = styled.span`
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
`

const ReportConflictLoadingIconBox = styled(ReportConflictIconBox)``

const ReportConflictTooltipContainer = styled.div`
  & > div {
    font-weight: bold;
  }
`

export default PlanningConflictForReport
