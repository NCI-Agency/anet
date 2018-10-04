import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SimpleModal from 'components/SimpleModal'
import AdvisorReportsTable from 'components/AdvisorReports/AdvisorReportsTable'

import API from 'api'


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
        API.query(/* GraphQL */`
          advisorReportInsights(orgUuid: $orgUuid) { uuid name stats { week nrReportsSubmitted nrEngagementsAttended }}
        `, {orgUuid: orgUuid}, '($orgUuid: String!)')
          .then(data => {
            this.setState({
                advisors: data.advisorReportInsights
            })
        })
    }

    render() {
        return (
            <SimpleModal title={ this.props.name }
                onClickModalOpen={ this.handleModalOpen }
                size="large">
                <AdvisorReportsTable
                    data={ this.state.advisors }
                    columnGroups={ this.props.columnGroups}
                    />
            </SimpleModal >
        )
    }
}

AdvisorReportsModal.propTypes = {
    columnGroups: PropTypes.array,
    name: PropTypes.string,
}

export default AdvisorReportsModal
