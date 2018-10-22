import PropTypes from 'prop-types'

import React from 'react'
import Page, {mapDispatchToProps, jumpToTop, propTypes as pagePropTypes} from 'components/Page'
import moment from 'moment'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'

import ReportForm from './Form'

import API from 'api'
import {Report, Person} from 'models'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class BaseReportEdit extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	static modelName = 'Report'

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			success: null,
			error: null,
			report: new Report(),
			originalReport: new Report(),
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			report(uuid:"${props.match.params.uuid}") {
				uuid, intent, engagementDate, atmosphere, atmosphereDetails, state
				keyOutcomes, reportText, nextSteps, cancelledReason,
				author { uuid, name },
				location { uuid, name },
				attendees {
					uuid, name, role, primary
					position { uuid, name, code, organization { uuid, shortName}, location {uuid, name} }
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
		const { currentUser } = this.props

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
		const operation = 'deleteReport'
		let graphql = operation + '(uuid: $uuid)'
		const variables = { uuid: this.state.report.uuid }
		const variableDef = '($uuid: String!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				this.props.history.push({
					pathname: '/',
					state: {success: 'Report deleted'}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}
}

const ReportEdit = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseReportEdit currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(withRouter(ReportEdit))
