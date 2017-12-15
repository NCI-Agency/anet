import React, {PropTypes} from 'react'
import Page from 'components/Page'
import {ListGroup, ListGroupItem} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'
import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'

import GuidedTour from 'components/GuidedTour'
import {orgTour} from 'pages/HopscotchTour'

import OrganizationTasks from './OrganizationTasks'
import OrganizationLaydown from './Laydown'
import OrganizationApprovals from './Approvals'

import dict from 'dictionary'
import {Organization, Position} from 'models'
import GQL from 'graphqlapi'

const PENDING_APPROVAL = 'PENDING_APPROVAL'
const NO_REPORT_FILTER = 'NO_FILTER'

export default class OrganizationShow extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	static modelName = 'Organization'

	constructor(props) {
		super(props)

		this.state = {
			organization: new Organization({id: props.params.id}),
			reports: null,
			tasks: null,
			reportsFilter: NO_REPORT_FILTER,
			action: props.params.action
		}

		this.reportsPageNum = 0
		this.tasksPageNum = 0
		this.togglePendingApprovalFilter = this.togglePendingApprovalFilter.bind(this)
		setMessages(props,this.state)
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.params.action !== this.state.action) {
			this.setState({action: nextProps.params.action})
		}

		if (+nextProps.params.id !== this.state.organization.id) {
			this.loadData(nextProps)
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if(prevState.reportsFilter !== this.state.reportsFilter){
			let reports = this.getReportQueryPart(this.props.params.id)
			this.runGQLReports([reports])
		}
	}

	getReportQueryPart(orgId) {
		let reportQuery = {
			pageNum: this.reportsPageNum,
			pageSize: 10,
			orgId: orgId,
			state: (this.reportsFilterIsSet()) ? this.state.reportsFilter : null
		}
		let reportsPart = new GQL.Part(/* GraphQL */`
			reports: reportList(query:$reportQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`)
			.addVariable("reportQuery", "ReportSearchQuery", reportQuery)
		return reportsPart
	}

	gettaskQueryPart(orgId) {
		let taskQuery = {
			pageNum: this.tasksPageNum,
			status: 'ACTIVE',
			pageSize: 10,
			responsibleOrgId: orgId
		}
		let taskPart = new GQL.Part(/* GraphQL */`
			tasks: taskList(query:$taskQuery) {
				pageNum, pageSize, totalCount, list {
					id, shortName, longName
				}
			}`)
			.addVariable("taskQuery", "TaskSearchQuery", taskQuery)
		return taskPart
	}

	fetchData(props) {
		let orgPart = new GQL.Part(/* GraphQL */`
			organization(id:${props.params.id}) {
				id, shortName, longName, identificationCode, type
				parentOrg { id, shortName, longName, identificationCode }
				childrenOrgs { id, shortName, longName, identificationCode },
				positions {
					id, name, code, status, type,
					person { id, name, status, rank }
					associatedPositions {
						id, name, code, status
						person { id, name, status, rank}
					}
				},
				approvalSteps {
					id, name, approvers { id, name, person { id, name}}
				}
			}`)
		let reportsPart = this.getReportQueryPart(props.params.id)
		let tasksPart = this.gettaskQueryPart(props.params.id)

		this.runGQL([orgPart, reportsPart, tasksPart])
	}

	runGQL(queries) {
		GQL.run(queries).then(data =>
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
		if(toggleToFilter === PENDING_APPROVAL){
			toggleToFilter = NO_REPORT_FILTER
		}else{
			toggleToFilter = PENDING_APPROVAL
		}
		this.setState({ reportsFilter: toggleToFilter })
	}

	render() {
		let org = this.state.organization
		let reports = this.state.reports
		let tasks = this.state.tasks

		let currentUser = this.context.currentUser
		let isSuperUser = currentUser && currentUser.isSuperUserForOrg(org)
		let isAdmin = currentUser && currentUser.isAdmin()

		let superUsers = org.positions.filter(pos => pos.status !== 'INACTIVE' && (!pos.person || pos.person.status !== 'INACTIVE') && (pos.type === Position.TYPE.SUPER_USER || pos.type === Position.TYPE.ADMINISTRATOR))
		let [labelLongName, labelIdentificationCode] = (org.type === "PRINCIPAL_ORG")
			? [dict.lookup('PRINCIPAL_ORG_LABEL_LONGNAME'),
			   dict.lookup('PRINCIPAL_ORG_LABEL_IDENTIFICATIONCODE')]
			: [dict.lookup('ADVISOR_ORG_LABEL_LONGNAME'),
			   dict.lookup('ADVISOR_ORG_LABEL_IDENTIFICATIONCODE')]

		return (
			<div>
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
						{isAdmin && <LinkTo organization={Organization.pathForNew({parentOrgId: org.id})} button>
							Create sub-organization
						</LinkTo>}

						{isSuperUser && <LinkTo organization={org} edit button="primary" id="editButton">
							Edit
						</LinkTo>}
					</div>}>

						<Form.Field id="type">
							{org.humanNameOfType()}
						</Form.Field>

						<Form.Field id="longName" label={labelLongName} />

						<Form.Field id="identificationCode" label={labelIdentificationCode} />

						{org.parentOrg && org.parentOrg.id &&
							<Form.Field id="parentOrg" label="Parent organization">
								<LinkTo organization={org.parentOrg} >{org.parentOrg.shortName} {org.parentOrg.longName} {org.parentOrg.identificationCode}</LinkTo>
							</Form.Field>
						}

						{org.isAdvisorOrg() &&
							<Form.Field id="superUsers" label="Super users">
								{superUsers.map(position =>
									<p key={position.id}>
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
									<ListGroupItem key={org.id} >
										<LinkTo organization={org} >{org.shortName} {org.longName} {org.identificationCode}</LinkTo>
									</ListGroupItem>
								)}
							</ListGroup>
						</Form.Field>}
					</Fieldset>

					<OrganizationLaydown organization={org} />
					<OrganizationApprovals organization={org} />
					<OrganizationTasks organization={org} tasks={tasks} goToPage={this.goTotasksPage}/>

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
		let reportQueryPart = this.getReportQueryPart(this.state.organization.id)
		GQL.run([reportQueryPart]).then(data =>
			this.setState({reports: data.reports})
		)
	}

	@autobind
	goTotasksPage(pageNum) {
		this.tasksPageNum = pageNum
		let taskQueryPart = this.gettaskQueryPart(this.state.organization.id)
		GQL.run([taskQueryPart]).then(data =>
			this.setState({tasks: data.tasks})
		)
	}

}
