import API from "api"
import { gql } from "apollo-boost"
import AdvisorReportsTable from "components/AdvisorReports/AdvisorReportsTable"
import SimpleModal from "components/SimpleModal"
import PropTypes from "prop-types"
import React, { Component } from "react"

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

class AdvisorReportsModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      advisors: []
    }
    this.handleModalOpen = this.handleModalOpen.bind(this)
  }

  handleModalOpen() {
    this.fetchAdvisors(this.props.uuid)
  }

  fetchAdvisors(orgUuid) {
    API.query(GQL_GET_ADVISOR_REPORTS_INSIGHT, { orgUuid }).then(data => {
      this.setState({
        advisors: data.advisorReportInsights
      })
    })
  }

  render() {
    return (
      <SimpleModal
        title={this.props.name}
        onClickModalOpen={this.handleModalOpen}
        size="large"
      >
        <AdvisorReportsTable
          data={this.state.advisors}
          columnGroups={this.props.columnGroups}
        />
      </SimpleModal>
    )
  }
}

AdvisorReportsModal.propTypes = {
  columnGroups: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired
}

export default AdvisorReportsModal
