import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import Breadcrumbs from 'components/Breadcrumbs'
import ReportCollection from 'components/ReportCollection'
import GQL from 'graphqlapi'
import Fieldset from 'components/Fieldset'
import autobind from 'autobind-decorator'
import {Person, Report} from 'models'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BaseMyReports extends Page {

	static propTypes = {
		...pagePropTypes,
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

	componentDidUpdate(prevProps, prevState) {
		if(prevProps.location.search !== this.props.location.search) {
			this.assignPageNums(this.props.location.search)
		}
		super.componentDidUpdate(prevProps, prevState)
	}

	componentDidMount() {
		this.assignPageNums(this.props.location.search)
		super.componentDidMount()
	}

	assignPageNums(params) {
		const searchParams = new URLSearchParams(params)
		const updatePageNums = {}
		for (const param of searchParams) {
			const key = param[0]
			const pageObj = { [key]: parseInt(param[1]) }
			Object.assign(updatePageNums, pageObj)
		}
		Object.assign(this.pageNums, updatePageNums)
	}

	pushPageNumHistory(paramName, pageNum) {
		this.props.history.push({
			search: `?${paramName}=${pageNum}`,
		})
	}

	@autobind
	getPart(partName, state, authorUuid) {
		const queryConstPart = {
			pageSize: 10,
			pageNum: this.pageNums[partName],
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

			{this.renderSection('Draft Reports', this.state.draft, this.goToPage.bind(this, 'draft'), 'draft-reports')}
			{this.renderSection('Upcoming Engagements', this.state.future, this.goToPage.bind(this, 'future'), 'upcoming-engagements')}
			{this.renderSection("Pending Approval", this.state.pending, this.goToPage.bind(this, 'pending'), 'pending-approval')}
			{this.renderSection("Published Reports", this.state.released, this.goToPage.bind(this, 'released'), 'published-reports')}
		</div>
	}

	renderSection(title, reports, goToPage, id) {
		let content = <p>Loading...</p>
		if (reports && reports.list) {
			content = <ReportCollection paginatedReports={reports} goToPage={goToPage} mapId={id} />
		}

		return <Fieldset title={title} id={id}>
			{content}
		</Fieldset>
	}

	@autobind
	goToPage(section, pageNum) {
		this.pageNums[section] = pageNum
		const part = (this.partFuncs[section])(this.props.currentUser.uuid)
		GQL.run([part]).then( data => {
			let stateChange = {}
			stateChange[section] = data[section]
			console.log(stateChange)
			this.setState(stateChange, this.pushPageNumHistory(section, pageNum))
		})
	}
}

const mapStateToProps = (state, ownProps) => ({
	searchQuery: state.searchQuery
})
const MyReports = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseMyReports currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(mapStateToProps, mapDispatchToProps)(MyReports)
