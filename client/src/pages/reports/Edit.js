import PropTypes from 'prop-types'

import React from 'react'
import Page, {mapDispatchToProps, jumpToTop, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

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


	state = {
		report: new Report(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			report(uuid:"${props.match.params.uuid}") {
				uuid, intent, engagementDate, atmosphere, atmosphereDetails, state
				keyOutcomes, reportText, nextSteps, cancelledReason,
				author { uuid, name },
				location { uuid, name },
				attendees {
					uuid, name, role, primary, status, endOfTourDate
					position { uuid, name, code, status, organization { uuid, shortName}, location {uuid, name} }
				}
				tasks { uuid, shortName, longName, responsibleOrg { uuid, shortName} }
				tags { uuid, name, description }
				reportSensitiveInformation { uuid, text }
				authorizationGroups { uuid, name, description }
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			function getReportFromData() {
				Object.assign(data.report, {
					cancelled: data.report.cancelledReason ? true : false,
					reportTags: (data.report.tags || []).map(tag => ({id: tag.uuid.toString(), text: tag.name})),
				})
				return new Report(data.report)
			}
			this.setState({report: getReportFromData()})
		})
	}

	render() {
		const { report } = this.state
		const { currentUser } = this.props

		//Only the author can delete a report, and only in DRAFT.
		const canDelete = (report.isDraft() || report.isRejected()) && Person.isEqual(currentUser, report.author)
		const onConfirmDeleteProps = {
				onConfirmDelete: this.onConfirmDelete,
				objectType: "report",
				objectDisplay: `#${this.state.report.uuid}`,
				bsStyle: "warning",
				buttonLabel: "Delete this report"
		}
		const showReportText = !!report.reportText || !!report.reportSensitiveInformation

		return (
			<div className="report-edit">
				<RelatedObjectNotes notes={report.notes} relatedObject={report.uuid && {relatedObjectType: 'reports', relatedObjectUuid: report.uuid}} />
				<Breadcrumbs items={[[`Report #${report.uuid}`, Report.pathForEdit(report)]]} />
				<ReportForm edit initialValues={report} title={`Report #${report.uuid}`} onDelete={canDelete && onConfirmDeleteProps} showReportText={showReportText} />
			</div>
		)
	}

	onConfirmDelete = () => {
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
