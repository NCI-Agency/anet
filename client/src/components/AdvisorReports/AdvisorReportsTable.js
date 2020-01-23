import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AdvisorReportsRow from "components/AdvisorReports/AdvisorReportsRow"
import AdvisorReportsTableHead from "components/AdvisorReports/AdvisorReportsTableHead"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import _uniqueId from "lodash/uniqueId"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_ADVISOR_REPORTS_INSIGHT = gql`
  query($orgUuid: String!) {
    advisorReportInsights(orgUuid: $orgUuid) {
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

const AdvisorReportsTable = ({ pageDispatchers, columnGroups, orgUuid }) => {
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_ADVISOR_REPORTS_INSIGHT,
    {
      orgUuid
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
  const rows = advisors.map(advisor => {
    return (
      <AdvisorReportsRow
        row={advisor}
        columnGroups={columnGroups}
        key={_uniqueId(`${advisor.uuid}_`)}
      />
    )
  })

  return (
    <Table striped bordered condensed hover responsive>
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

AdvisorReportsTable.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  columnGroups: PropTypes.array,
  orgUuid: PropTypes.string
}

export default connect(null, mapPageDispatchersToProps)(AdvisorReportsTable)
