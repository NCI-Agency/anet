import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'
import Breadcrumbs from 'components/Breadcrumbs'
import ReportCollection from 'components/ReportCollection'
import GQL from 'graphqlapi'
import Fieldset from 'components/Fieldset'
import autobind from 'autobind-decorator'
import {Report} from 'models'

import { setPageProps } from 'actions'
import { connect } from 'react-redux'

class MyReports extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props)

		this.state = {
			draft: null,
			future: null,
			pending: null,
			released: null
		}
		this.pageNums = {
			draft: 0,
			future: 0,
			pending: 0,
			released: 0
		}
		this.partFuncs = {
			draft: this.getPart.bind(this, 'draft', [Report.STATE.DRAFT, Report.STATE.REJECTED]),
			future: this.getPart.bind(this, 'future', [Report.STATE.FUTURE]),
			pending: this.getPart.bind(this, 'pending', [Report.STATE.PENDING_APPROVAL]),
			released: this.getPart.bind(this, 'released', [Report.STATE.RELEASED, Report.STATE.CANCELLED])
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		if (!this.state.reports) {
			this.loadData(nextProps, nextContext)
		}
	}

	@autobind
	getPart(partName, state, authorUuid) {
		let query = {
			pageSize: 10,
			pageNum: this.pageNums[partName],
			authorUuid: authorUuid,
			state: state
		}
		return new GQL.Part(/* GraphQL */ `
			${partName}: reportList(query: $${partName}Query) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`).addVariable(partName + "Query", "ReportSearchQuery", query)
	}

	fetchData(props, context) {
		if (!context.currentUser || !context.currentUser.uuid) {
			return
		}
		let authorUuid = context.currentUser.uuid
		let pending = this.partFuncs.pending(authorUuid)
		let draft = this.partFuncs.draft(authorUuid)
		let future = this.partFuncs.future(authorUuid)
		let released = this.partFuncs.released(authorUuid)

		GQL.run([pending, draft, future, released]).then(data =>
			this.setState({
				pending: data.pending,
				draft: data.draft,
				released: data.released,
				future: data.future
			})
		)
	}

	render() {
		return <div>
			<Breadcrumbs items={[['My Reports', window.location.pathname]]} />

			{this.renderSection('Draft Reports', this.state.draft, this.goToPage.bind(this, 'draft'), 'draft-reports')}
			{this.renderSection('Upcoming Engagements', this.state.future, this.goToPage.bind(this, 'future'), 'upcoming-engagements')}
			{this.renderSection("Pending Approval", this.state.pending, this.goToPage.bind(this, 'pending'), 'pending-approval')}
			{this.renderSection("Published Reports", this.state.released, this.goToPage.bind(this, 'released'), 'published-reports')}
		</div>
	}

	renderSection(title, reports, goToPage, id) {
		let content = <p>Loading...</p>
		if (reports && reports.list) {
			content = <ReportCollection paginatedReports={reports} goToPage={goToPage} />
		}

		return <Fieldset title={title} id={id}>
			{content}
		</Fieldset>
	}

	@autobind
	goToPage(section, pageNum) {
		this.pageNums[section] = pageNum
		let part = (this.partFuncs[section])(this.context.currentUser.uuid)
		GQL.run([part]).then( data => {
			let stateChange = {}
			stateChange[section] = data[section]
			console.log(stateChange)
			this.setState(stateChange)
		})
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(MyReports)
