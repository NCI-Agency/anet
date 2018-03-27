import PropTypes from 'prop-types'

import React from 'react'
import Page from 'components/Page'
import moment from 'moment'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'

import ReportForm from './Form'

import API from 'api'
import {Report, Person} from 'models'

import { confirmAlert } from 'react-confirm-alert'
import 'components/react-confirm-alert.css'

import { withRouter } from 'react-router-dom'

class ReportEdit extends Page {
	static pageProps = {
		useNavigation: false
	}

	static modelName = 'Report'

	static contextTypes = {
		currentUser: PropTypes.object,
	}

	constructor(props) {
		super(props)

		this.state = {
			report: new Report(),
			originalReport: new Report(),
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			report(id:${props.match.params.id}) {
				id, intent, engagementDate, atmosphere, atmosphereDetails, state
				keyOutcomes, reportText, nextSteps, cancelledReason,
				author { id, name },
				location { id, name },
				attendees {
					id, name, role, primary
					position { id, name }
				}
				tasks { id, shortName, longName, responsibleOrg { id, shortName} }
				tags { id, name, description }
				reportSensitiveInformation { id, text }
				authorizationGroups { id, name, description }
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

		return (
			<div className="report-edit">
				<Breadcrumbs items={[['Report #' + report.id, '/reports/' + report.id], ['Edit', '/reports/' + report.id + '/edit']]} />

				<NavigationWarning original={this.state.originalReport} current={report} />
				<ReportForm edit report={report} title={`Edit Report #${report.id}`} onDelete={canDelete && this.deleteReport} />
			</div>
		)
	}

	@autobind
	deleteReport() {
		confirmAlert({
			title: 'Confirm to delete report',
			message: "Are you sure you want to delete this report? This cannot be undone.",
			confirmLabel: `Yes, I am sure that I want to delete report #${this.state.report.id}`,
			cancelLabel: 'No, I am not entirely sure at this point',
			onConfirm: () => {
				API.send(`/api/reports/${this.state.report.id}/delete`, {}, {method: 'DELETE'}).then(data => {
					this.props.history.push({
						pathname: '/',
						state: {success: 'Report deleted'}
					})
				}, data => {
					this.setState({success:null})
					this.handleError(data)
				})
			}
		})
	}
}

export default withRouter(ReportEdit)
