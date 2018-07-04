import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'

import ReportForm from './Form'

import GuidedTour from 'components/GuidedTour'
import {reportTour} from 'pages/HopscotchTour'

import {Person, Report} from 'models'

import AppContext from 'components/AppContext'
import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class BaseReportNew extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			report: new Report(),
			originalReport: new Report(),
		}
	}

	componentDidUpdate() {
		this.addCurrentUserAsAttendee()
	}

	componentDidMount() {
		this.addCurrentUserAsAttendee()
	}

	addCurrentUserAsAttendee() {
		const { currentUser } = this.props
		let newAttendee = currentUser

		const addedAttendeeToReport = this.state.report.addAttendee(newAttendee)
		const addedAttendeeToOriginalReport = this.state.originalReport.addAttendee(newAttendee)

		if (addedAttendeeToReport || addedAttendeeToOriginalReport) {
			this.forceUpdate()
		}
	}

	render() {
		return (
			<div className="report-new">
				<div className="pull-right">
					<GuidedTour
						title="Take a guided tour of the report page."
						tour={reportTour}
						autostart={localStorage.newUser === 'true' && localStorage.hasSeenReportTour !== 'true'}
						onEnd={() => localStorage.hasSeenReportTour = 'true'}
					/>
				</div>

				<Breadcrumbs items={[['Submit a report', Report.pathForNew()]]} />
				<Messages error={this.state.error} />

				<ReportForm original={this.state.originalReport} report={this.state.report} title="Create a new Report" />
			</div>
		)
	}
}

const ReportNew = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseReportNew currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(ReportNew)
