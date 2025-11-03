import {
  gqlMinimalPersonFields,
  gqlMinimalReportFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import {
  Callout,
  Icon,
  Intent,
  Popover,
  PopoverInteractionKind,
  Spinner,
  Tooltip
} from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import LinkTo from "components/LinkTo"
import { Report } from "models"
import moment from "moment"
import pluralize from "pluralize"
import React from "react"
import { Button } from "react-bootstrap"

const GET_PERSON_WITH_REPORTS = gql`
  query ($uuid: String!, $attendedReportsQuery: ReportSearchQueryInput!) {
    person(uuid: $uuid) {
      ${gqlMinimalPersonFields}
      attendedReports(query: $attendedReportsQuery) {
        list {
          ${gqlMinimalReportFields}
          duration
        }
      }
    }
  }
`

interface BasePlanningConflictForPersonProps {
  person: any
  report: any
  iconOnly?: boolean
}

const BasePlanningConflictForPerson = ({
  person,
  report,
  iconOnly
}: BasePlanningConflictForPersonProps) => {
  const { loading, error, data } = API.useApiQuery(GET_PERSON_WITH_REPORTS, {
    uuid: person.uuid,
    attendedReportsQuery: {
      state: Object.values(Report.STATE),
      engagementDateStart: moment(report.engagementDate)
        .startOf("day")
        .toISOString(),
      engagementDateEnd: moment(report.engagementDate)
        .endOf("day")
        .toISOString()
    }
  })

  if (loading) {
    return (
      <Tooltip content="Checking for planning conflicts…">
        <Spinner intent={Intent.WARNING} size={20} />
      </Tooltip>
    )
  }

  if (error) {
    return (
      <Tooltip
        content="Error occured while checking for planning conflicts!"
        intent={Intent.DANGER}
      >
        <Icon icon={IconNames.ERROR} intent={Intent.DANGER} />
      </Tooltip>
    )
  }

  const conflictingReports = (data?.person?.attendedReports?.list || [])
    .filter(ar => Report.hasConflict(report, ar))
    .sort((a, b) =>
      a.engagementDate === b.engagementDate
        ? (a.duration || 0) - (b.duration || 0)
        : a.engagementDate - b.engagementDate
    )

  if (!conflictingReports.length) {
    return null
  }

  return (
    <Popover
      interactionKind={PopoverInteractionKind.CLICK}
      usePortal={false}
      autoFocus={false}
      enforceFocus={false}
      content={
        <Callout
          title={`${person.toString()} has ${
            conflictingReports.length
          } conflicting ${pluralize("report", conflictingReports.length)}`}
          intent={Intent.WARNING}
        >
          {conflictingReports.map(report => (
            <LinkTo
              key={report.uuid}
              modelType="Report"
              model={report}
              style={{ display: "block" }}
            >
              {Report.getFormattedEngagementDate(report)}&nbsp;({report.state})
            </LinkTo>
          ))}
        </Callout>
      }
    >
      <Button variant="warning" size="sm">
        <Icon icon={IconNames.WARNING_SIGN} intent={Intent.WARNING} />
        {!iconOnly && (
          <>
            {conflictingReports.length}&nbsp;
            {pluralize("conflict", conflictingReports.length)}
          </>
        )}
      </Button>
    </Popover>
  )
}

interface PlanningConflictForPersonProps {
  person?: any
  report?: any
  iconOnly?: boolean
}

const PlanningConflictForPerson = ({
  person,
  report,
  iconOnly
}: PlanningConflictForPersonProps) => {
  if (!person?.uuid || !report?.engagementDate) {
    return null
  }
  return (
    <BasePlanningConflictForPerson
      person={person}
      report={report}
      iconOnly={iconOnly}
    />
  )
}

export default PlanningConflictForPerson
