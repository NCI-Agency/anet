import PropTypes from 'prop-types'

import React from 'react'
import Page from 'components/Page'
import moment from 'moment'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'

import ReportForm from './Form'

import API from 'api'
import {Report, Person} from 'models'

import { withRouter } from 'react-router-dom'
import { setPageProps, PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class ReportEdit extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static modelName = 'Report'

	static contextTypes = {
		currentUser: PropTypes.object,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			report: new Report(),
			originalReport: new Report(),
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			report(uuid:"${props.match.params.uuid}") {
				uuid, intent, engagementDate, atmosphere, atmosphereDetails, state
				keyOutcomes, reportText, nextSteps, cancelledReason,
				author { uuid, name },
				location { uuid, name },
				attendees {
					uuid, name, role, primary
					position { uuid, name, organization { uuid, shortName} }
				}
				tasks { uuid, shortName, longName, responsibleOrg { uuid, shortName} }
				tags { uuid, name, description }
				reportSensitiveInformation { uuid, text }
				authorizationGroups { uuid, name, description }
			}
		`).then(data => {
			function getReportFromData() {
				const report = new Report(data.report)
				report.engagementDate = report.engagementDate && moment(report.engagementDate).format()
				return report
			}
			this.setState({report: getReportFromData(), originalReport: getReportFromData()})
		})
	}

	render() {
		let {report} = this.state
		let {currentUser} = this.context

		//Only the author can delete a report, and only in DRAFT.
		let canDelete = (report.isDraft() || report.isRejected()) && Person.isEqual(currentUser, report.author)
		const onConfirmDeleteProps = {
				onConfirmDelete: this.onConfirmDelete,
				objectType: "report",
				objectDisplay: `#${this.state.report.uuid}`,
				bsStyle: "warning",
				buttonLabel: "Delete this report"
		}

		return (
			<div className="report-edit">
				<Breadcrumbs items={[['Report #' + report.uuid, '/reports/' + report.uuid], ['Edit', '/reports/' + report.uuid + '/edit']]} />

				<ReportForm edit original={this.state.originalReport} report={report} title={`Edit Report #${report.uuid}`} onDelete={canDelete && onConfirmDeleteProps} />
			</div>
		)
	}

	@autobind
	onConfirmDelete() {
		API.send(`/api/reports/${this.state.report.uuid}/delete`, {}, {method: 'DELETE'}).then(data => {
			this.props.history.push({
				pathname: '/',
				state: {success: 'Report deleted'}
			})
		}, data => {
			this.setState({success:null})
			this.handleError(data)
		})
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(withRouter(ReportEdit))
