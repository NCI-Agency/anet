import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {ListGroup, ListGroupItem, Nav, NavItem} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'

import Breadcrumbs from 'components/Breadcrumbs'
import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'
import DictionaryField from '../../HOC/DictionaryField'
import SubNav from 'components/SubNav'

import GuidedTour from 'components/GuidedTour'
import {orgTour} from 'pages/HopscotchTour'

import OrganizationTasks from './OrganizationTasks'
import OrganizationLaydown from './Laydown'
import OrganizationApprovals from './Approvals'

import Settings from 'Settings'
import {Organization, Person, Position, Report, Task} from 'models'
import GQL from 'graphqlapi'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'
import Scrollspy from 'react-scrollspy'

const NO_REPORT_FILTER = 'NO_FILTER'

class BaseOrganizationShow extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
		scrollspyOffset: PropTypes.number,
	}

	static modelName = 'Organization'

	constructor(props) {
		super(props)

		this.state = {
			organization: new Organization({uuid: props.match.params.uuid}),
			reports: null,
			tasks: null,
			reportsFilter: NO_REPORT_FILTER,
		}

		this.reportsPageNum = 0
		this.tasksPageNum = 0
		this.togglePendingApprovalFilter = this.togglePendingApprovalFilter.bind(this)
		this.IdentificationCodeFieldWithLabel = DictionaryField(Form.Field)
		this.LongNameWithLabel = DictionaryField(Form.Field)

		setMessages(props,this.state)
	}

	componentDidMount() {
		this.reportsPageNum = this.getPageNum('reportsPage', this.props.location.search)
		super.componentDidMount()
	}

	componentDidUpdate(prevProps, prevState) {
		// Re-load data if uuid has changed
		if(prevProps.location.search !== this.props.location.search) {
			this.reportsPageNum = this.getPageNum('reportsPage', this.props.location.search)
		}
		if (this.props.match.params.uuid !== prevProps.match.params.uuid) {
			this.loadData()
		}
		else if (prevState.reportsFilter !== this.state.reportsFilter) {
			let reports = this.getReportQueryPart(this.props.match.params.uuid)
			this.runGQLReports([reports])
		}
	}

	getReportQueryPart(orgUuid) {
		let reportQuery = {
			pageNum: this.reportsPageNum,
			pageSize: 10,
			orgUuid: orgUuid,
			state: (this.reportsFilterIsSet()) ? this.state.reportsFilter : null
		}
		let reportsPart = new GQL.Part(/* GraphQL */`
			reports: reportList(query:$reportQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`)
			.addVariable("reportQuery", "ReportSearchQueryInput", reportQuery)
		return reportsPart
	}

	getTaskQueryPart(orgUuid) {
		let taskQuery = {
			pageNum: this.tasksPageNum,
			status: Task.STATUS.ACTIVE,
			pageSize: 10,
			responsibleOrgUuid: orgUuid
		}
		let taskPart = new GQL.Part(/* GraphQL */`
			tasks: taskList(query:$taskQuery) {
				pageNum, pageSize, totalCount, list {
					uuid, shortName, longName
				}
			}`)
			.addVariable("taskQuery", "TaskSearchQueryInput", taskQuery)
		return taskPart
	}

	fetchData(props) {
		let orgPart = new GQL.Part(/* GraphQL */`
			organization(uuid:"${props.match.params.uuid}") {
				uuid, shortName, longName, status, identificationCode, type
				parentOrg { uuid, shortName, longName, identificationCode }
				childrenOrgs { uuid, shortName, longName, identificationCode },
				positions {
					uuid, name, code, status, type,
					person { uuid, name, status, rank }
					associatedPositions {
						uuid, name, code, status
						person { uuid, name, status, rank}
					}
				},
				approvalSteps {
					uuid, name, approvers { uuid, name, person { uuid, name, rank}}
				}
			}`)
		let reportsPart = this.getReportQueryPart(props.match.params.uuid)
		let tasksPart = this.getTaskQueryPart(props.match.params.uuid)

		return this.runGQL([orgPart, reportsPart, tasksPart])
	}

	runGQL(queries) {
		return GQL.run(queries).then(data =>
			this.setState({
				organization: new Organization(data.organization),
				reports: data.reports,
				tasks: data.tasks
			})
		)
	}

	runGQLReports(reports){
		GQL.run(reports).then( data => this.setState({ reports: data.reports }) )
	}

	reportsFilterIsSet() {
		return (this.state.reportsFilter !== NO_REPORT_FILTER)
	}

	togglePendingApprovalFilter() {
		let toggleToFilter = this.state.reportsFilter
		if(toggleToFilter === Report.STATE.PENDING_APPROVAL){
			toggleToFilter = NO_REPORT_FILTER
		}else{
			toggleToFilter = Report.STATE.PENDING_APPROVAL
		}
		this.setState({ reportsFilter: toggleToFilter })
	}

	getPageNum(name, params) {
		const searchParams = new URLSearchParams(params)
		const pageNum = searchParams.get(name)
		return pageNum ? pageNum : 0
	}

	pushSearchHistory(paramName, paramValue) {
		this.props.history.push({
			search: `?${paramName}=${paramValue}`,
		})
	}

	render() {
		const org = this.state.organization
		const reports = this.state.reports
		const tasks = this.state.tasks

		const { currentUser } = this.props
		const isSuperUser = currentUser && currentUser.isSuperUserForOrg(org)
		const isAdmin = currentUser && currentUser.isAdmin()
		const isPrincipalOrg = org.type === Organization.TYPE.PRINCIPAL_ORG

		const superUsers = org.positions.filter(pos => pos.status !== Position.STATUS.INACTIVE && (!pos.person || pos.person.status !== Position.STATUS.INACTIVE) && (pos.type === Position.TYPE.SUPER_USER || pos.type === Position.TYPE.ADMINISTRATOR))
		const orgSettings = isPrincipalOrg ? Settings.fields.principal.org : Settings.fields.advisor.org
		const myOrg = currentUser && currentUser.position ? currentUser.position.organization : null
		const isMyOrg = myOrg && (org.uuid === myOrg.uuid)
		const orgSubNav = (
			<Nav>
				<Scrollspy className="nav" currentClassName="active" offset={this.props.scrollspyOffset}
				items={ ['info', 'supportedPositions', 'vacantPositions', 'approvals', 'tasks', 'reports'] }>
					<NavItem href="#info">Info</NavItem>
					<NavItem href="#supportedPositions">Supported positions</NavItem>
					<NavItem href="#vacantPositions">Vacant positions</NavItem>
					{!isPrincipalOrg && <NavItem href="#approvals">Approvals</NavItem>}
					{org.isTaskEnabled() && <NavItem href="#tasks">{pluralize(Settings.fields.task.shortLabel)}</NavItem> }
					<NavItem href="#reports">Reports</NavItem>
				</Scrollspy>
			</Nav>
		)
		return (
			<div>
				<SubNav subnavElemId="myorg-nav">
					{isMyOrg && orgSubNav}
				</SubNav>

				<SubNav subnavElemId="org-nav">
					{!isMyOrg && orgSubNav}
				</SubNav>

				{currentUser.isSuperUser() && <div className="pull-right">
					<GuidedTour
						title="Take a guided tour of this organization's page."
						tour={orgTour}
						autostart={localStorage.newUser === 'true' && localStorage.hasSeenOrgTour !== 'true'}
						onEnd={() => localStorage.hasSeenOrgTour = 'true'}
					/>
				</div>}

				<Breadcrumbs items={[[org.shortName || 'Organization', Organization.pathFor(org)]]} />

				<Messages error={this.state.error} success={this.state.success} />

				<Form formFor={org} static horizontal>
					<Fieldset id="info" title={org.shortName} action={<div>
						{isAdmin && <LinkTo organization={Organization.pathForNew({parentOrgUuid: org.uuid})} button>
							Create sub-organization
						</LinkTo>}

						{isSuperUser && <LinkTo organization={org} edit button="primary" id="editButton">
							Edit
						</LinkTo>}
					</div>}>

						<Form.Field id="status" />

						<Form.Field id="type">
							{org.humanNameOfType()}
						</Form.Field>

						<this.LongNameWithLabel dictProps={orgSettings.longName} id="longName"/>

						<this.IdentificationCodeFieldWithLabel dictProps={orgSettings.identificationCode} id="identificationCode"/>
		
						{org.parentOrg && org.parentOrg.uuid &&
							<Form.Field id="parentOrg" label="Parent organization">
								<LinkTo organization={org.parentOrg} >{org.parentOrg.shortName} {org.parentOrg.longName} {org.parentOrg.identificationCode}</LinkTo>
							</Form.Field>
						}

						{org.isAdvisorOrg() &&
							<Form.Field id="superUsers" label="Super users">
								{superUsers.map(position =>
									<p key={position.uuid}>
										{position.person ?
											<LinkTo person={position.person} />
											:
											<i><LinkTo position={position} />- (Unfilled)</i>
										}
									</p>
								)}
								{superUsers.length === 0 && <p><i>No super users</i></p>}
							</Form.Field>
						}

						{org.childrenOrgs && org.childrenOrgs.length > 0 && <Form.Field id="childrenOrgs" label="Sub organizations">
							<ListGroup>
								{org.childrenOrgs.map(org =>
									<ListGroupItem key={org.uuid} >
										<LinkTo organization={org} >{org.shortName} {org.longName} {org.identificationCode}</LinkTo>
									</ListGroupItem>
								)}
							</ListGroup>
						</Form.Field>}
					</Fieldset>

					<OrganizationLaydown organization={org} />
					{!isPrincipalOrg && <OrganizationApprovals organization={org} />}
					{ org.isTaskEnabled() &&
						<OrganizationTasks organization={org} tasks={tasks} goToPage={this.goToTasksPage}/>
					}

					<Fieldset id="reports" title={`Reports from ${org.shortName}`}>
						<ReportCollection
							paginatedReports={reports}
							goToPage={this.goToReportsPage}
							setReportsFilter={this.togglePendingApprovalFilter}
							filterIsSet={this.reportsFilterIsSet()}
							isSuperUser={isSuperUser}
						/>
					</Fieldset>
				</Form>
			</div>
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.reportsPageNum = pageNum
		let reportQueryPart = this.getReportQueryPart(this.state.organization.uuid)
		GQL.run([reportQueryPart]).then(data =>
			this.setState({reports: data.reports}, this.pushSearchHistory('reportsPage', pageNum))
		)
	}

	@autobind
	goToTasksPage(pageNum) {
		this.tasksPageNum = pageNum
		let taskQueryPart = this.getTaskQueryPart(this.state.organization.uuid)
		GQL.run([taskQueryPart]).then(data =>
			this.setState({tasks: data.tasks})
		)
	}

}



const OrganizationShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseOrganizationShow currentUser={context.currentUser} scrollspyOffset={context.scrollspyOffset} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(OrganizationShow)
