import React, {PropTypes} from 'react'
import Page from 'components/Page'
import moment from 'moment'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'
import History from 'components/History'

import ReportForm from './Form'

import API from 'api'
import {Report, Person} from 'models'

export default class ReportEdit extends Page {
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
			report(id:${props.params.id}) {
				id, intent, engagementDate, atmosphere, atmosphereDetails, state
				keyOutcomes, reportText, nextSteps, cancelledReason,
				author { id, name },
				location { id, name },
				attendees {
					id, name, role, primary
					position { id, name }
				}
				poams { id, shortName, longName, responsibleOrg { id, shortName} }
				tags { id, name, description }
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
		if (!confirm("Are you sure you want to delete this report? This cannot be undone.")) {
			return
		}

		API.send(`/api/reports/${this.state.report.id}/delete`, {}, {method: 'DELETE'}).then(data => {
			History.push('/', {success: 'Report deleted'})
		}, data => {
			this.setState({success:null})
			this.handleError(data)
		})
	}
}
