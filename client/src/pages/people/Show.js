import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Table, FormGroup, Col, ControlLabel, Button} from 'react-bootstrap'
import moment from 'moment'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import ReportCollection from 'components/ReportCollection'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import AssignPositionModal from 'components/AssignPositionModal'
import EditAssociatedPositionsModal from 'components/EditAssociatedPositionsModal'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import GuidedTour from 'components/GuidedTour'
import {personTour} from 'pages/HopscotchTour'

import {Person, Position} from 'models'
import * as PersonDefs from 'models/Person'
import autobind from 'autobind-decorator'
import GQL from 'graphqlapi'
import Settings from 'Settings'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

class BasePersonShow extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	static modelName = 'User'

	state = {
		person: new Person({
			uuid: this.props.match.params.uuid,
			previousPositions: [],
		}),
		authoredReports: null,
		attendedReports: null,
		authoredReportsPageNum: 0,
		attendedReportsPageNum: 0,
		showAssignPositionModal: false,
		showAssociatedPositionsModal: false,
	}

	constructor(props) {
		super(props)
		setMessages(props,this.state)
	}

	getAuthoredReportsPart(personUuid) {
		let query = {
			pageNum: this.state.authoredReportsPageNum,
			pageSize: 10,
			authorUuid : personUuid
		}
		let part = new GQL.Part(/* GraphQL */`
			authoredReports: reportList(query: $authorQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`)
			.addVariable("authorQuery", "ReportSearchQueryInput", query)
		return part
	}

	getAttendedReportsPart(personUuid) {
		let query = {
			pageNum: this.state.attendedReportsPageNum,
			pageSize: 10,
			attendeeUuid: personUuid
		}
		let part = new GQL.Part(/* GraphQL */ `
			attendedReports: reportList(query: $attendeeQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}`)
			.addVariable("attendeeQuery", "ReportSearchQueryInput", query)
		return part
	}

	fetchData(props) {
		let personPart = new GQL.Part(/* GraphQL */`
			person(uuid:"${props.match.params.uuid}") {
				uuid,
				name, rank, role, status, emailAddress, phoneNumber, domainUsername,
				biography, country, gender, endOfTourDate,
				position {
					uuid,
					name,
					type,
					organization {
						uuid, shortName
					},
					associatedPositions {
						uuid, name,
						person { uuid, name, rank },
						organization { uuid, shortName }
					}
				}
				previousPositions { startTime, endTime, position { uuid, name }}
				${GRAPHQL_NOTES_FIELDS}
		}`)
		let authoredReportsPart = this.getAuthoredReportsPart(props.match.params.uuid)
		let attendedReportsPart = this.getAttendedReportsPart(props.match.params.uuid)

		return GQL.run([personPart, authoredReportsPart, attendedReportsPart]).then(data =>
			this.setState({
				person: new Person(data.person),
				authoredReports: data.authoredReports,
				attendedReports: data.attendedReports
			})
		)
	}

	render() {
		const { person, attendedReports, authoredReports } = this.state
		const { currentUser, ...myFormProps } = this.props
		// The position for this person's counterparts
		const position = person.position
		const assignedRole = position.type === Position.TYPE.PRINCIPAL ? Settings.fields.advisor.person.name : Settings.fields.principal.person.name

				//User can always edit themselves
		//Admins can always edit anybody
		//SuperUsers can edit people in their org, their descendant orgs, or un-positioned people.
		const isAdmin = currentUser && currentUser.isAdmin()
		const hasPosition = position && position.uuid
		const canEdit = Person.isEqual(currentUser, person) ||
			isAdmin ||
			(hasPosition && currentUser.isSuperUserForOrg(position.organization)) ||
			(!hasPosition && currentUser.isSuperUser()) ||
			(person.role === Person.ROLE.PRINCIPAL && currentUser.isSuperUser())
		const canChangePosition = isAdmin ||
			(!hasPosition && currentUser.isSuperUser()) ||
			(hasPosition && currentUser.isSuperUserForOrg(position.organization)) ||
			(person.role === Person.ROLE.PRINCIPAL && currentUser.isSuperUser())

		return (
			<Formik
				enableReinitialize={true}
				initialValues={person}
				{...myFormProps}
			>
			{({
				values,
			}) => {
				const action = <div>
					{canEdit && <LinkTo person={person} edit button="primary" className="edit-person">Edit</LinkTo>}
				</div>
				const emailHumanValue = <a href={`mailto:${person.emailAddress}`}>{person.emailAddress}</a>

				return <div>
					<div className="pull-right">
						<GuidedTour
							title="Take a guided tour of this person's page."
							tour={personTour}
							autostart={localStorage.newUser === 'true' && localStorage.hasSeenPersonTour !== 'true'}
							onEnd={() => localStorage.hasSeenPersonTour = 'true'}
						/>
					</div>

					<RelatedObjectNotes notes={person.notes} relatedObject={person.uuid && {relatedObjectType: 'people', relatedObjectUuid: person.uuid}} />
					<Breadcrumbs items={[[person.name, Person.pathFor(person)]]} />
					<Messages error={this.state.error} success={this.state.success} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={`${person.rank} ${person.name}`} action={action} />
						<Fieldset>
							<Field
								name="rank"
								label={PersonDefs.fieldLabels.rank}
								component={FieldHelper.renderReadonlyField}
							/>
							<Field
								name="role"
								component={FieldHelper.renderReadonlyField}
								humanValue={Person.humanNameOfRole(values.role)}
							/>
							{isAdmin &&
								<Field
									name="domainUsername"
									component={FieldHelper.renderReadonlyField}
								/>
							}
							<Field
								name="status"
								component={FieldHelper.renderReadonlyField}
								humanValue={Person.humanNameOfStatus(values.status)}
							/>
							<Field
								name="phoneNumber"
								label={PersonDefs.fieldLabels.phoneNumber}
								component={FieldHelper.renderReadonlyField}
							/>
							<Field
								name="emailAddress"
								label={PersonDefs.fieldLabels.emailAddress}
								component={FieldHelper.renderReadonlyField}
								humanValue={emailHumanValue}
							/>
							<Field
								name="country"
								label={PersonDefs.fieldLabels.country}
								component={FieldHelper.renderReadonlyField}
							/>
							<Field
								name="gender"
								label={PersonDefs.fieldLabels.gender}
								component={FieldHelper.renderReadonlyField}
							/>
							<Field
								name="endOfTourDate"
								label={PersonDefs.fieldLabels.endOfTourDate}
								component={FieldHelper.renderReadonlyField}
								humanValue={person.endOfTourDate && moment(person.endOfTourDate).format('D MMM YYYY')}
							/>
							<Field
								name="biography"
								className="biography"
								component={FieldHelper.renderReadonlyField}
								value={<div dangerouslySetInnerHTML={{__html: person.biography}} />}
							/>
						</Fieldset>

						<Fieldset title="Position" >
							<Fieldset title="Current Position" id="current-position"
								className={(!position || !position.uuid) ? 'warning' : undefined}
								action={position && position.uuid && canChangePosition &&
									<div>
										<LinkTo position={position} edit button="default" >Edit position details</LinkTo>
										<Button onClick={this.showAssignPositionModal} className="change-assigned-position">
											Change assigned position
										</Button>
									</div>}>
								{position && position.uuid
									? this.renderPosition(position)
									: this.renderPositionBlankSlate(person)
								}
								{canChangePosition &&
									<AssignPositionModal
										showModal={this.state.showAssignPositionModal}
										person={person}
										onCancel={this.hideAssignPositionModal.bind(this, false)}
										onSuccess={this.hideAssignPositionModal.bind(this, true)}
									/>
								}
							</Fieldset>

							{position && position.uuid &&
								<Fieldset title={`Assigned ${assignedRole}`} action={canChangePosition && <Button onClick={this.showAssociatedPositionsModal}>Change assigned {assignedRole}</Button>}>
									{this.renderCounterparts(position)}
									{canChangePosition &&
										<EditAssociatedPositionsModal
											position={position}
											showModal={this.state.showAssociatedPositionsModal}
											onCancel={this.hideAssociatedPositionsModal.bind(this, false)}
											onSuccess={this.hideAssociatedPositionsModal.bind(this, true)}
										/>
									}
								</Fieldset>
							}
						</Fieldset>

						{person.isAdvisor() && authoredReports &&
							<Fieldset title="Reports authored" id="reports-authored">
								<ReportCollection mapId="reports-authored"
									paginatedReports={authoredReports}
									goToPage={this.goToAuthoredPage}
								 />
							</Fieldset>
						}

						{attendedReports &&
							<Fieldset title={`Reports attended by ${person.name}`} id="reports-attended">
								<ReportCollection mapId="reports-attended"
									paginatedReports={attendedReports}
									goToPage={this.goToAttendedPage}
								/>
							</Fieldset>
						}

						<Fieldset title="Previous positions" id="previous-positions">
							<Table>
								<thead>
									<tr>
										<th>Position</th>
										<th>Dates</th>
									</tr>
								</thead>
								<tbody>
									{person.previousPositions.map( (pp, idx) =>
										<tr key={idx} id={`previousPosition_${idx}`}>
											<td><LinkTo position={pp.position} /></td>
											<td>
												{moment(pp.startTime).format('D MMM YYYY')} - &nbsp;
												{pp.endTime && moment(pp.endTime).format('D MMM YYYY')}
											</td>
										</tr>
									)}
								</tbody>
							</Table>
						</Fieldset>
					</Form>
				</div>
			}
		}
		</Formik>
		)
	}

	renderPosition(position) {
		return <div style={{textAlign: 'center'}}>
					<h4>
						<LinkTo position={position} className="position-name" />  (<LinkTo organization={position.organization} />)
					</h4>
			</div>
	}

	renderCounterparts(position) {
		let assocTitle = position.type === Position.TYPE.PRINCIPAL ? 'Is advised by' : 'Advises'
		return <FormGroup controlId="counterparts">
			<Col sm={2} componentClass={ControlLabel}>{assocTitle}</Col>
			<Col sm={10}>
				<Table>
					<thead>
						<tr><th>Name</th><th>Position</th><th>Organization</th></tr>
					</thead>
					<tbody>
						{Position.map(position.associatedPositions, assocPos =>
							<tr key={assocPos.uuid}>
								<td>{assocPos.person && <LinkTo person={assocPos.person} />}</td>
								<td><LinkTo position={assocPos} /></td>
								<td><LinkTo organization={assocPos.organization} /></td>
							</tr>
						)}
					</tbody>
				</Table>
				{position.associatedPositions.length === 0 && <em>{position.name} has no counterparts assigned</em>}
			</Col>
		</FormGroup>
	}

	renderPositionBlankSlate(person) {
		const { currentUser } = this.props
		//when the person is not in a position, any super user can assign them.
		let canChangePosition = currentUser.isSuperUser()

		if (Person.isEqual(currentUser, person)) {
			return <em>You are not assigned to a position. Contact your organization's super user to be added.</em>
		} else {
			return <div style={{textAlign: 'center'}}>
				<p className="not-assigned-to-position-message"><em>{person.name} is not assigned to a position.</em></p>
				{canChangePosition &&
					<p><Button onClick={this.showAssignPositionModal}>Assign position</Button></p>
				}
			</div>
		}
	}

	@autobind
	showAssignPositionModal() {
		this.setState({showAssignPositionModal: true})
	}

	@autobind
	hideAssignPositionModal(success) {
		this.setState({showAssignPositionModal: false})
		if (success) {
			this.fetchData(this.props)
		}
	}

	@autobind
	showAssociatedPositionsModal() {
		this.setState({showAssociatedPositionsModal: true})
	}

	@autobind
	hideAssociatedPositionsModal(success) {
		this.setState({showAssociatedPositionsModal: false})
		if (success) {
			this.fetchData(this.props)
		}
	}

	@autobind
	goToAuthoredPage(pageNum) {
		this.setState({authoredReportsPageNum: pageNum}, () => {
			const part = this.getAuthoredReportsPart(this.state.person.uuid)
			GQL.run([part]).then(data =>
				this.setState({authoredReports: data.authoredReports})
			)
		})
	}

	@autobind
	goToAttendedPage(pageNum) {
		this.setState({attendedReportsPageNum: pageNum}, () => {
			const part = this.getAttendedReportsPart(this.state.person.uuid)
			GQL.run([part]).then(data =>
				this.setState({attendedReports: data.attendedReports})
			)
		})
	}

}

const PersonShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BasePersonShow currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(PersonShow)
