import { gql } from "@apollo/client"
import API from "api"
import AdvisorReportsRow from "components/AdvisorReports/AdvisorReportsRow"
import AdvisorReportsTableHead from "components/AdvisorReports/AdvisorReportsTableHead"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_ADVISOR_REPORTS_INSIGHT = gql`
  query ($orgUuid: String!, $weeksAgo: Int) {
    advisorReportInsights(orgUuid: $orgUuid, weeksAgo: $weeksAgo) {
      uuid
      name
      stats {
        week
        nrReportsSubmitted
        nrEngagementsAttended
      }
    }
  }
`

interface AdvisorReportsTableProps {
  pageDispatchers?: PageDispatchersPropType
  columnGroups?: number[]
  orgUuid?: string
  weeksAgo?: number
}

const AdvisorReportsTable = ({
  pageDispatchers,
  columnGroups,
  orgUuid,
  weeksAgo
}: AdvisorReportsTableProps) => {
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_ADVISOR_REPORTS_INSIGHT,
    {
      orgUuid,
      weeksAgo
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid: orgUuid,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const advisors = data.advisorReportInsights
  const rows = advisors.map(advisor => (
    <AdvisorReportsRow
      row={advisor}
      columnGroups={columnGroups}
      key={`${advisor.uuid}`}
    />
  ))

  return (
    <Table striped bordered hover responsive>
      <caption>
        Shows reports submitted and engagements attended per week for each{" "}
        {Settings.fields.advisor.person.name} in the organization
      </caption>
      <AdvisorReportsTableHead
        title={Settings.fields.advisor.person.name}
        columnGroups={columnGroups}
      />
      <tbody>{rows}</tbody>
    </Table>
  )
}

export default connect(null, mapPageDispatchersToProps)(AdvisorReportsTable)
