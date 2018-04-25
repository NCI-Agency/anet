import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'

import ReportForm from './Form'

import GuidedTour from 'components/GuidedTour'
import {reportTour} from 'pages/HopscotchTour'

import {Report} from 'models'

import { setPageProps, PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class ReportNew extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			report: new Report(),
			originalReport: new Report(),
		}
	}

	componentWillUpdate() {
		this.addCurrentUserAsAttendee()
	}

	componentWillMount() {
		this.addCurrentUserAsAttendee()
	}

	addCurrentUserAsAttendee() {
		let newAttendee = this.context.app.state.currentUser

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

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(ReportNew)
