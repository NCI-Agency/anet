import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Modal, Alert, Button, HelpBlock, Popover, Overlay} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import moment from 'moment'
import pluralize from 'pluralize'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import DailyRollupChart from 'components/DailyRollupChart'
import ReportCollection, {FORMAT_MAP, FORMAT_SUMMARY, FORMAT_TABLE, GQL_REPORT_FIELDS} from 'components/ReportCollection'
import CalendarButton from 'components/CalendarButton'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import Form from 'components/Form'
import Messages from 'components/Messages'
import Settings from 'Settings'

import {Organization, Report} from 'models'
import utils from 'utils'

import API from 'api'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps as loaderMapDispatchToProps} from 'HOC/LoaderHOC'

import MosaicLayout from 'components/MosaicLayout'
import ContainerDimensions from 'react-container-dimensions'
import { IconNames } from '@blueprintjs/icons'

const BarChartWithLoader = connect(null, loaderMapDispatchToProps)(LoaderHOC('isLoading')('data')(DailyRollupChart))
const Context = React.createContext()

const barColors = {
	cancelled: '#EC971F',
	verified: '#337AB7',
}

const calendarButtonCss = {
	marginLeft: '20px',
	marginTop: '-8px',
}

const legendCss = {
	width: '14px',
	height: '14px',
	display: 'inline-block',
}

class BaseRollupShow extends Page {

	static propTypes = {
		...pagePropTypes,
		date: PropTypes.object,
	}

	get dateStr() { return this.state.date.format('DD MMM YYYY') }
	get dateLongStr() { return this.state.date.format('DD MMMM YYYY') }
	get rollupStart() { return moment(this.state.date).subtract(1, 'days').startOf('day').hour(19) } //7pm yesterday
	get rollupEnd() { return moment(this.state.date).endOf('day').hour(18) } // 6:59:59pm today.

	constructor(props) {
		super(props)

		this.CHART_ID = 'reports_by_day_of_week'
		this.GQL_CHART_FIELDS = /* GraphQL */`
			org {uuid shortName}
			released
			cancelled
		`
		this.GQL_MAP_FIELDS = /* GraphQL */`
			uuid
			intent
			location { uuid name lat lng }
		`
		this.VISUALIZATIONS = [
			{
				id: 'rbdow-chart',
				icons: [IconNames.GROUPED_BAR_CHART],
				title: 'Chart by organization',
				renderer: this.getBarChart,
			},
			{
				id: 'rbdow-collection',
				icons: [IconNames.PANEL_TABLE],
				title: 'Reports by organization',
				renderer: this.getReportCollection,
			},
			{
				id: 'rbdow-map',
				icons: [IconNames.MAP],
				title: 'Map by organization',
				renderer: this.getReportMap,
			},
		]
		this.INITIAL_LAYOUT = {
			direction: 'row',
			first: this.VISUALIZATIONS[0].id,
			second: {
				direction: 'column',
				first: this.VISUALIZATIONS[1].id,
				second: this.VISUALIZATIONS[2].id,
			}
		}
		this.DESCRIPTION = `Number of reports released today per organization.`

		const qs = utils.parseQueryString(props.location.search)
		this.state = {
			date: moment(+props.date || +qs.date || undefined),
			reports: {list: []},
			reportsPageNum: 0,
			graphData: [],
			showEmailModal: false,
			email: {},
			maxReportAge: null,
			hoveredBar: {org: {}},
			orgType: Organization.TYPE.ADVISOR_ORG,
			updateChart: true,  // whether the chart needs to be updated
			isLoading: false
		}
		this.previewPlaceholderUrl = API.addAuthParams("/help")
	}

	static getDerivedStateFromProps(props, state) {
		const stateUpdate = {}
		const qs = utils.parseQueryString(props.location.search)
		const date = moment(+qs.date || undefined)
		if (!state.date.isSame(date, 'day')) {
			Object.assign(stateUpdate, {date: date})
		}
		const { appSettings } = props || {}
		const maxReportAge = appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS
		if (maxReportAge !== state.maxReportAge) {
			Object.assign(stateUpdate, {maxReportAge: maxReportAge})
		}
		return stateUpdate
	}

	componentDidUpdate(prevProps, prevState) {
		if (!this.state.date.isSame(prevState.date, 'day') || prevState.maxReportAge !== this.state.maxReportAge) {
			this.loadData()
		}
	}

	fetchData(props) {
		if (!this.state.maxReportAge) {
			//don't run the query unless we've loaded the rollup settings.
			return
		}

		this.setState({isLoading: true})
		this.props.showLoading()
		Promise.all([
			// Query used by the chart
			this.fetchChartData(this.runChartQuery(...this.chartQueryParams())),
			this.fetchReportData(true)
		]).then(() => this.props.hideLoading())
	}

	fetchReportData(includeAll) {
		// Query used by the reports collection
		const queries = [this.runReportsQuery(this.reportsQueryParams(false), false)]
		if (includeAll) {
			// Query used by the map
			queries.push(this.runReportsQuery(this.reportsQueryParams(true), true))
		}
		return Promise.all(queries).then(values => {
			const stateUpdate = {
				updateChart: false,  // only update the report list
				reports: values[0].reportList
			}
			if (includeAll) {
				Object.assign(stateUpdate, {
					allReports: values[1].reportList.list
				})
			}
			this.setState(stateUpdate)
		})
	}

	chartQueryParams = () => {
		let chartQuery = 'rollupGraph(startDate: $startDate, endDate: $endDate'
		let chartQueryParamsDef = '($startDate: Long!, $endDate: Long!'
		const chartQueryParams = {
			startDate: this.rollupStart.valueOf(),
			endDate: this.rollupEnd.valueOf(),
		}
		if (this.state.focusedOrg) {
			if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
				chartQuery += ', principalOrganizationUuid: $principalOrganizationUuid'
				chartQueryParamsDef += ', $principalOrganizationUuid: String!'
				chartQueryParams.principalOrganizationUuid = this.state.focusedOrg.uuid
			} else {
				chartQuery += ' ,advisorOrganizationUuid: $advisorOrganizationUuid'
				chartQueryParamsDef += ', $advisorOrganizationUuid: String!'
				chartQueryParams.advisorOrganizationUuid = this.state.focusedOrg.uuid
			}
		} else if (this.state.orgType) {
			chartQuery += ', orgType: $orgType'
			chartQueryParamsDef += ', $orgType: OrganizationType!'
			chartQueryParams.orgType = this.state.orgType
		}
		chartQuery += ')'
		chartQueryParamsDef += ')'
		Object.assign(chartQueryParams, {
			pageNum: 0,
			pageSize: 0,  // retrieve all the filtered reports
		})
		return [chartQuery, chartQueryParams, chartQueryParamsDef]
	}

	runChartQuery = (chartQuery,chartQueryParams, chartQueryParamsDef) => {
		return API.query(/* GraphQL */`
			${chartQuery} {
				${this.GQL_CHART_FIELDS}
			}`, chartQueryParams, chartQueryParamsDef)
	}

	reportsQueryParams = (forMap) => {
		const reportsQueryParams = {
			state: [Report.STATE.RELEASED], //Specifically excluding cancelled engagements.
			releasedAtStart: this.rollupStart.valueOf(),
			releasedAtEnd: this.rollupEnd.valueOf(),
			engagementDateStart: moment(this.rollupStart).subtract(this.state.maxReportAge, 'days').valueOf(),
			sortBy: "ENGAGEMENT_DATE",
			sortOrder: "DESC",
		}
		Object.assign(reportsQueryParams, this.getSearchQuery(this.props))
		Object.assign(reportsQueryParams, {
			pageNum: forMap ? 0 : this.state.reportsPageNum,
			pageSize: forMap ? 0 : 10
		})
		if (this.state.focusedOrg) {
			if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
				reportsQueryParams.principalOrgUuid = this.state.focusedOrg.uuid
				reportsQueryParams.includePrincipalOrgChildren = true
			} else {
				reportsQueryParams.advisorOrgUuid = this.state.focusedOrg.uuid
				reportsQueryParams.includeAdvisorOrgChildren = true
			}
		}
		return reportsQueryParams
	}

	runReportsQuery = (reportsQueryParams, forMap) => {
		return API.query(/* GraphQL */`
			reportList(query:$reportsQueryParams) {
				pageNum, pageSize, totalCount, list {
					${forMap ? this.GQL_MAP_FIELDS : GQL_REPORT_FIELDS}
				}
			}`, {reportsQueryParams}, '($reportsQueryParams: ReportSearchQueryInput)')
	}

	@autobind
	fetchChartData(chartQuery) {
		return Promise.all([chartQuery]).then(values => {
		const pinned_ORGs = Settings.pinned_ORGs
			this.setState({
				isLoading: false,
				updateChart: true,  // update chart after fetching the data
				graphData: values[0].rollupGraph
					.map(d => {d.org = d.org || {uuid: "-1", shortName: "Other"}; return d})
					.sort((a, b) => {
						let a_index = pinned_ORGs.indexOf(a.org.shortName)
						let b_index = pinned_ORGs.indexOf(b.org.shortName)
						if (a_index<0) {
							let nameOrder = a.org.shortName.localeCompare(b.org.shortName)
							return (b_index<0) ? (nameOrder === 0 ? a.org.uuid - b.org.uuid : nameOrder) : 1
						}
						else {
							return (b_index<0) ? -1 : a_index-b_index
						}
					})
			})
		})
	}

	@autobind
	getBarChart(id) {
		return <Context.Consumer>{context => (
			<div className="scrollable-y">
				<ContainerDimensions>{({width}) => (
						<BarChartWithLoader
							width={width}
							chartId={this.CHART_ID}
							data={context.graphData}
							onBarClick={this.goToOrg}
							showPopover={this.showPopover}
							hidePopover={this.hidePopover}
							updateChart={context.updateChart}
							isLoading={context.isLoading}
							barColors={barColors}
						/>
				)}</ContainerDimensions>

				<Overlay
					show={!!context.graphPopover}
					placement="top"
					container={document.body}
					animation={false}
					target={() => context.graphPopover}
				>
					<Popover id="graph-popover" title={context.hoveredBar && context.hoveredBar.org.shortName}>
						<p>Released: {context.hoveredBar && context.hoveredBar.released}</p>
						<p>Cancelled: {context.hoveredBar && context.hoveredBar.cancelled}</p>
						<p>Click to view details</p>
					</Popover>
				</Overlay>

				<div className="graph-legend">
					<div style={{...legendCss, background: barColors.verified}}></div> Released reports:&nbsp;
					<strong>{context.graphData.reduce((acc, org) => acc + org.released, 0)}</strong>
				</div>
				<div className="graph-legend">
					<div style={{...legendCss, background: barColors.cancelled}}></div> Cancelled engagements:&nbsp;
					<strong>{context.graphData.reduce((acc, org) => acc + org.cancelled, 0)}</strong>
				</div>
			</div>
		)}</Context.Consumer>
	}

	@autobind
	getReportCollection(id)
	{
		return <Context.Consumer>{context => (
			<div className="scrollable">
				<ReportCollection
					paginatedReports={context.reports}
					goToPage={this.goToReportsPage}
					viewFormats={[FORMAT_TABLE, FORMAT_SUMMARY]}
				/>
			</div>
		)}</Context.Consumer>
	}

	@autobind
	getReportMap(id)
	{
		return <Context.Consumer>{context => (
			<div className="non-scrollable">
				<ContainerDimensions>{({width, height}) => (
					<ReportCollection
						width={width}
						height={height}
						marginBottom={0}
						reports={context.allReports}
						viewFormats={[FORMAT_MAP]}
					/>
				)}</ContainerDimensions>
			</div>
		)}</Context.Consumer>
	}

	render() {
		const flexStyle = {display: 'flex', flexDirection: 'column', height: '100%', flex: 1}

		return (
			<div id="daily-rollup" style={flexStyle}>
				<Breadcrumbs items={[[`Rollup for ${this.dateStr}`, '/rollup']]} />
				<Messages error={this.state.error} success={this.state.success} />

				<Fieldset title={
					<span>
						Daily Rollup{this.state.focusedOrg && ` for ${this.state.focusedOrg.shortName}`} - {this.dateLongStr}
						<CalendarButton onChange={this.changeRollupDate} value={this.state.date.format('YYYY-MM-DD')} style={calendarButtonCss} />
						{this.state.focusedOrg
							? <Button onClick={() => this.goToOrg()}>All organizations</Button>
							: <ButtonToggleGroup value={this.state.orgType} onChange={this.changeOrgType}>
								<Button value={Organization.TYPE.ADVISOR_ORG}>{pluralize(Settings.fields.advisor.org.name)}</Button>
								<Button value={Organization.TYPE.PRINCIPAL_ORG}>{pluralize(Settings.fields.principal.org.name)}</Button>
							  </ButtonToggleGroup>
						}
					</span>
				} action={
					<span>
						<Button href={this.previewPlaceholderUrl} target="rollup" onClick={this.printPreview}>Print</Button>
						<Button onClick={this.toggleEmailModal} bsStyle="primary">Email rollup</Button>
					</span>
				} style={flexStyle}>
					<Context.Provider value={this.state}>
						<MosaicLayout
							style={flexStyle}
							visualizations={this.VISUALIZATIONS}
							initialNode={this.INITIAL_LAYOUT}
							description={this.DESCRIPTION}
						/>
					</Context.Provider>
				</Fieldset>

				{this.renderEmailModal()}
			</div>
		)
	}

	@autobind
	goToReportsPage(newPage) {
		this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchReportData(false))
	}

	@autobind
	goToOrg(org) {
		this.setState({reportsPageNum: 0, focusedOrg: org, isLoading: true}, () => this.loadData())
	}

	@autobind
	changeOrgType(orgType) {
		this.setState({orgType, isLoading: true}, () => this.loadData())
	}

	@autobind
	changeRollupDate(newDate) {
		let date = moment(newDate)
		this.props.history.replace({
			pathname: 'rollup',
			search: utils.formatQueryString({date: date.valueOf()})
		})
	}

	@autobind
	showPopover(graphPopover, hoveredBar) {
		this.setState({graphPopover, hoveredBar})
	}

	@autobind
	hidePopover() {
		this.setState({graphPopover: null, hoveredBar: null})
	}

	@autobind
	renderEmailModal() {
		let email = this.state.email
		return <Modal show={this.state.showEmailModal} onHide={this.toggleEmailModal}>
			<Form formFor={email} onChange={this.onChange} submitText={false} >
				<Modal.Header closeButton>
					<Modal.Title>Email rollup - {this.dateStr}</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					<h5>
						{this.state.focusedOrg ?
							`Reports for ${this.state.focusedOrg.shortName}` :
							`All reports by ${this.state.orgType.replace('_', ' ').toLowerCase()}`
						}
					</h5>

					{email.errors &&
						<Alert bsStyle="danger">{email.errors}</Alert>
					}

					<Form.Field id="to" />
					<HelpBlock>
						One or more email addresses, comma separated, e.g.:<br />
						<em>jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr. X" &lt;x@example.org&gt;</em>
					</HelpBlock>
					<Form.Field componentClass="textarea" id="comment" />
				</Modal.Body>

				<Modal.Footer>
					<Button href={this.previewPlaceholderUrl} target="rollup" onClick={this.showPreview}>Preview</Button>
					<Button bsStyle="primary" onClick={this.emailRollup}>Send email</Button>
				</Modal.Footer>
			</Form>
		</Modal>
	}

	@autobind
	toggleEmailModal() {
		this.setState({showEmailModal: !this.state.showEmailModal})
	}

	@autobind
	printPreview() {
		this.showPreview(true)
	}

	@autobind
	showPreview(print) {
		let graphQL = /* GraphQL */`
			showRollupEmail(
				startDate: ${this.rollupStart.valueOf()},
				endDate: ${this.rollupEnd.valueOf()}
		`
		if (this.state.focusedOrg) {
			if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
				graphQL += `, principalOrganizationUuid: ${this.state.focusedOrg.uuid}`
			} else {
				graphQL += `, advisorOrganizationUuid: ${this.state.focusedOrg.uuid}`
			}
		}
		if (this.state.orgType) {
			graphQL += `, orgType: ${this.state.orgType}`
		}
		graphQL += `)`
		API.query(graphQL).then(data => {
			let rollupWindow = window.open("", "rollup")
			let doc = rollupWindow.document
			doc.clear()
			doc.open()
			doc.write(data.showRollupEmail)
			doc.close()
			if (print === true) {
				rollupWindow.print()
			}
		})
	}

	@autobind
	emailRollup() {
		let email = this.state.email
		let r = utils.parseEmailAddresses(email.to)
		if (!r.isValid) {
			email.errors = r.message
			this.setState({email})
			return
		}
		const emailDelivery = {
			toAddresses: r.to,
			comment: email.comment
		}
		let graphql = 'emailRollup(startDate: $startDate, endDate: $endDate'
		const variables = {
				startDate: this.rollupStart.valueOf(),
				endDate: this.rollupEnd.valueOf()
		}
		let variableDef = '($startDate: Long!, $endDate: Long!'
		if (this.state.focusedOrg) {
			if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
				graphql += ', principalOrganizationUuid: $principalOrganizationUuid'
				variables.principalOrganizationUuid = this.state.focusedOrg.uuid
				variableDef += ', $principalOrganizationUuid: String!'
			} else {
				graphql += ',advisorOrganizationUuid: $advisorOrganizationUuid'
				variables.advisorOrganizationUuid = this.state.focusedOrg.uuid
				variableDef += ', $advisorOrganizationUuid: String!'
			}
		}
		if (this.state.orgType) {
			graphql += ', orgType: $orgType'
			variables.orgType = this.state.orgType
			variableDef += ', $orgType: OrganizationType!'
		}
		graphql += ', email: $email)'
		variables.email = emailDelivery
		variableDef += ', $email: AnetEmailInput!)'

		API.mutation(graphql, variables, variableDef)
			.then(data => {
				this.setState({
					success: 'Email successfully sent',
					error:null,
					showEmailModal: false,
					email: {}
				})
			}).catch(error => {
				this.setState({
					showEmailModal: false,
					email: {}
				})
				this.handleError(error)
			})
	}
}

const mapStateToProps = (state, ownProps) => ({
	searchQuery: state.searchQuery
})

const RollupShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseRollupShow appSettings={context.appSettings} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(RollupShow))
