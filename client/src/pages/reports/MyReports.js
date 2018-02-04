import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'
import Breadcrumbs from 'components/Breadcrumbs'
import ReportCollection from 'components/ReportCollection'
import GQL from 'graphqlapi'
import Fieldset from 'components/Fieldset'
import autobind from 'autobind-decorator'

export default class MyReports extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	constructor() {
		super()
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
			draft: this.getPart.bind(this, 'draft', ['DRAFT','REJECTED']),
			future: this.getPart.bind(this, 'future', ['FUTURE']),
			pending: this.getPart.bind(this, 'pending', ['PENDING_APPROVAL']),
			released: this.getPart.bind(this, 'released', ["RELEASED", "CANCELLED"])
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		if (!this.state.reports) {
			this.loadData(nextProps, nextContext)
		}
	}

	@autobind
	getPart(partName, state, authorId) {
		let query = {
			pageSize: 10,
			pageNum: this.pageNums[partName],
			authorId: authorId,
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
		if (!context.currentUser || !context.currentUser.id) {
			return
		}
		let authorId = context.currentUser.id
		let pending = this.partFuncs.pending(authorId)
		let draft = this.partFuncs.draft(authorId)
		let future = this.partFuncs.future(authorId)
		let released = this.partFuncs.released(authorId)

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
		let part = (this.partFuncs[section])(this.context.currentUser.id)
		GQL.run([part]).then( data => {
			let stateChange = {}
			stateChange[section] = data[section]
			console.log(stateChange)
			this.setState(stateChange)
		})
	}
}
