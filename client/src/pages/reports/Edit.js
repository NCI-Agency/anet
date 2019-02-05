import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import ReportForm from './Form'

import API from 'api'
import {Report} from 'models'

import { withRouter } from 'react-router-dom'
import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class ReportEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	static modelName = 'Report'

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
				author { uuid, name, rank, role },
				location { uuid, name },
				attendees {
					uuid, name, rank, role, primary, status, endOfTourDate
					position { uuid, name, type, code, status, organization { uuid, shortName}, location {uuid, name} }
				}
				tasks { uuid, shortName, longName, responsibleOrg { uuid, shortName} }
				tags { uuid, name, description }
				reportSensitiveInformation { uuid, text }
				authorizationGroups { uuid, name, description }
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			data.report.cancelled = !!data.report.cancelledReason
			data.report.reportTags = (data.report.tags || []).map(tag => ({id: tag.uuid.toString(), text: tag.name}))
			this.setState({report: new Report(data.report)})
		})
	}

	render() {
		const { report } = this.state

		return (
			<div className="report-edit">
				<RelatedObjectNotes notes={report.notes} relatedObject={report.uuid && {relatedObjectType: 'reports', relatedObjectUuid: report.uuid}} />
				<Breadcrumbs items={[[`Report #${report.uuid}`, Report.pathForEdit(report)]]} />
				<ReportForm edit initialValues={report} title={`Report #${report.uuid}`} showSensitiveInfo={!!report.reportSensitiveInformation && !!report.reportSensitiveInformation.text} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(withRouter(ReportEdit))
