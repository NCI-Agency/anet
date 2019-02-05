import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import Breadcrumbs from 'components/Breadcrumbs'
import ReportCollection from 'components/ReportCollection'
import GQL from 'graphqlapi'
import Fieldset from 'components/Fieldset'
import autobind from 'autobind-decorator'
import {Person, Report} from 'models'
import { Nav } from 'react-bootstrap'
import SubNav from 'components/SubNav'
import { AnchorNavItem } from 'components/Nav'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseMyReports extends Page {

	static propTypes = {
		...pagePropTypes,
		pagination: PropTypes.object,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)

		this.state = {
			draft: null,
			future: null,
			pending: null,
			released: null
		}
		this.partFuncs = {
			draft: this.getPart.bind(this, 'draft', [Report.STATE.DRAFT, Report.STATE.REJECTED]),
			future: this.getPart.bind(this, 'future', [Report.STATE.FUTURE]),
			pending: this.getPart.bind(this, 'pending', [Report.STATE.PENDING_APPROVAL]),
			released: this.getPart.bind(this, 'released', [Report.STATE.RELEASED, Report.STATE.CANCELLED])
		}
	}

	@autobind
	getPart(partName, state, authorUuid, pageNum = 0) {
		const queryConstPart = {
			pageSize: 10,
			pageNum: pageNum,
			authorUuid: authorUuid,
			state: state
		}
		const query = Object.assign({}, this.getSearchQuery(), queryConstPart)
		return new GQL.Part(/* GraphQL */ `
			${partName}: reportList(query: $${partName}Query) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`).addVariable(partName + "Query", "ReportSearchQueryInput", query)
	}

	fetchData(props) {
		const { currentUser } = props
		if (!currentUser || !currentUser.uuid) {
			return
		}
		const authorUuid = currentUser.uuid
		let pending = this.partFuncs.pending(authorUuid)
		let draft = this.partFuncs.draft(authorUuid)
		let future = this.partFuncs.future(authorUuid)
		let released = this.partFuncs.released(authorUuid)

		return GQL.run([pending, draft, future, released]).then(data =>
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
			<SubNav subnavElemId="reports-nav">
				<Nav>
					<AnchorNavItem to="draft-reports">Draft reports</AnchorNavItem>
					<AnchorNavItem to="upcoming-engagements">Upcoming Engagements</AnchorNavItem>
					<AnchorNavItem to="pending-approval">Pending approval</AnchorNavItem>
					<AnchorNavItem to="published-reports">Published reports</AnchorNavItem>
				</Nav>
			</SubNav>

			{this.renderSection('Draft Reports', this.state.draft, this.goToPage.bind(this, 'draft'), 'draft-reports', 'draft')}
			{this.renderSection('Upcoming Engagements', this.state.future, this.goToPage.bind(this, 'future'), 'upcoming-engagements', 'future')}
			{this.renderSection("Pending Approval", this.state.pending, this.goToPage.bind(this, 'pending'), 'pending-approval', 'pending')}
			{this.renderSection("Published Reports", this.state.released, this.goToPage.bind(this, 'released'), 'published-reports', 'released')}
		</div>
	}

	getPaginatedNum = (part, pageNum = 0) => {
		let goToPageNum = pageNum
		if (part !== undefined) {
			goToPageNum = part.pageNum
		}
		return goToPageNum
	}

	renderSection = (title, reports, goToPage, id, section) => {
		const paginatedPart = this.props.pagination[section]
		const goToPageNum = this.getPaginatedNum(paginatedPart)
		let content = <p>Loading...</p>
		if (reports && reports.list) {
			const paginatedReports = Object.assign(reports, {pageNum: goToPageNum})
			content = <ReportCollection paginatedReports={paginatedReports} goToPage={goToPage} mapId={id} />
		}

		return <Fieldset title={title} id={id}>
			{content}
		</Fieldset>
	}

	@autobind
	goToPage(section, pageNum) {
		const { currentUser, setPagination } = this.props
		const part = (this.partFuncs[section])(currentUser.uuid, pageNum)
		GQL.run([part]).then( data => {
			let stateChange = {}
			stateChange[section] = data[section]
			console.log(stateChange)
			this.setState(stateChange, () => setPagination(section, pageNum))
		})
	}
}

const mapStateToProps = (state, ownProps) => ({
	searchQuery: state.searchQuery,
	pagination: state.pagination,
})

const MyReports = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseMyReports currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(mapStateToProps, mapDispatchToProps)(MyReports)
