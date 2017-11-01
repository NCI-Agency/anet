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

import OrganizationPoams from './Poams'
import OrganizationLaydown from './Laydown'
import OrganizationApprovals from './Approvals'

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
			poams: null,
			reportsFilter: NO_REPORT_FILTER,
			action: props.params.action
		}

		this.reportsPageNum = 0
		this.poamsPageNum = 0
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

	getPoamQueryPart(orgId) {
		let poamQuery = {
			pageNum: this.poamsPageNum,
			status: 'ACTIVE',
			pageSize: 10,
			responsibleOrgId: orgId
		}
		let poamsPart = new GQL.Part(/* GraphQL */`
			poams: poamList(query:$poamQuery) {
				pageNum, pageSize, totalCount, list {
					id, shortName, longName
				}
			}`)
			.addVariable("poamQuery", "PoamSearchQuery", poamQuery)
		return poamsPart
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
		let poamsPart = this.getPoamQueryPart(props.params.id)

		this.runGQL([orgPart, reportsPart, poamsPart])
	}

	runGQL(queries) {
		GQL.run(queries).then(data =>
			this.setState({
				organization: new Organization(data.organization),
				reports: data.reports,
				poams: data.poams
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
		let poams = this.state.poams

		let currentUser = this.context.currentUser
		let isSuperUser = currentUser && currentUser.isSuperUserForOrg(org)
		let isAdmin = currentUser && currentUser.isAdmin()

		let superUsers = org.positions.filter(pos => pos.status !== 'INACTIVE' && (!pos.person || pos.person.status !== 'INACTIVE') && (pos.type === Position.TYPE.SUPER_USER || pos.type === Position.TYPE.ADMINISTRATOR))

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

						<Form.Field id="longName" label={org.type === "PRINCIPAL_ORG" ? "Official Organization Name" : "Description"}/>

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
					<OrganizationPoams organization={org} poams={poams} goToPage={this.goToPoamsPage}/>

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
	goToPoamsPage(pageNum) {
		this.poamsPageNum = pageNum
		let poamQueryPart = this.getPoamQueryPart(this.state.organization.id)
		GQL.run([poamQueryPart]).then(data =>
			this.setState({poams: data.poams})
		)
	}

}
