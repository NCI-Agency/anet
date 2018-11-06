import PropTypes from 'prop-types'

import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import {Alert, Table, Button, Col, HelpBlock, Modal, Checkbox} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import moment from 'moment'
import utils from 'utils'

import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import Messages from 'components/Messages'
import LinkTo from 'components/LinkTo'
import ReportApprovals from 'components/ReportApprovals'
import Tag from 'components/Tag'

import API from 'api'
import Settings from 'Settings'
import {Report, Person, Task, Comment, Position} from 'models'

import ConfirmDelete from 'components/ConfirmDelete'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { jumpToTop, AnchorLink } from 'components/Page'

import { SEARCH_OBJECT_TYPES } from 'actions'
import {deserializeQueryParams} from 'searchUtils'

class BaseReportShow extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	static modelName = 'Report'

	constructor(props) {
		super(props)

		this.state = {
			success: null,
			error: null,
			report: new Report({id: props.match.params.id}),
			newComment: new Comment(),
			approvalComment: new Comment(),
			showEmailModal: false,
			email: { toAddresses: '', comment: '' , errors: null}
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			report(id:${props.match.params.id}) {
				id, intent, engagementDate, atmosphere, atmosphereDetails
				keyOutcomes, reportText, nextSteps, cancelledReason

				state

				location { id, name }
				author {
					id, name, rank,
					position {
						organization {
							shortName, longName, identificationCode
							approvalSteps {
								id, name,
								approvers {
									id, name,
									person { id, name rank }
								}
							}
						}
					}
				}

				attendees {
					id, name, role, primary, rank, status, endOfTourDate
					position { id, name, code, status, organization { id, shortName}, location {id, name} }
				}
				primaryAdvisor { id }
				primaryPrincipal { id }

				tasks { id, shortName, longName, responsibleOrg { id, shortName} }

				comments {
					id, text, createdAt, updatedAt
					author { id, name, rank }
				}

				principalOrg { id, shortName, longName, identificationCode, type }
				advisorOrg { id, shortName, longName, identificationCode, type }

				approvalStatus {
					type, createdAt
					step { id , name
						approvers { id, name, person { id, name, rank } }
					},
					person { id, name, rank}
				}

				approvalStep { name, approvers { id }, nextStepId }

				tags { id, name, description }
				reportSensitiveInformation { id, text }
				authorizationGroups { id, name, description }
			}
		`).then(data => {
			this.setState({report: new Report(data.report)})
		})
	}

	renderNoPositionAssignedText() {
		const { currentUser } = this.props
		const alertStyle = {top:132, marginBottom: '1rem', textAlign: 'center'}
		const supportEmail = Settings.SUPPORT_EMAIL_ADDR
		const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ''
		const advisorPositionSingular = Settings.fields.advisor.position.name
		if (!currentUser.hasAssignedPosition()) {
			return <div className="alert alert-warning" style={alertStyle}>
					You cannot submit a report: you are not assigned to a {advisorPositionSingular} position.<br/>
					Please contact your organization's super user(s) and request to be assigned to a {advisorPositionSingular} position.<br/>
					If you are unsure, you can also contact the support team {supportEmailMessage}.
				</div>
		}
		else {
			return <div className="alert alert-warning" style={alertStyle}>
					You cannot submit a report: your assigned {advisorPositionSingular} position has an inactive status.<br/>
					Please contact your organization's super users and request them to assign you to an active {advisorPositionSingular} position.<br/>
					If you are unsure, you can also contact the support team {supportEmailMessage}.
				</div>
		}
	}

	render() {
		const {report} = this.state
		const { currentUser } = this.props

		//User can approve if report is pending approval and user is one of the approvers in the current approval step
		const canApprove = report.isPending() && currentUser.position &&
			report.approvalStep && report.approvalStep.approvers.find(member => Position.isEqual(member, currentUser.position))

		//Authors can edit in draft mode (also future engagements) or rejected mode
		let canEdit = (report.isDraft() || report.isFuture() || report.isRejected()) && Person.isEqual(currentUser, report.author)
		//Approvers can edit.
		canEdit = canEdit || canApprove

		//Only the author can submit when report is in draft or rejected AND author has a position
		const hasAssignedPosition = currentUser.hasAssignedPosition()
		const hasActivePosition = currentUser.hasActivePosition()
		const canSubmit = (report.isDraft() || report.isRejected()) && Person.isEqual(currentUser, report.author) && hasActivePosition

		//Anybody can email a report as long as it's not in draft.
		let canEmail = !report.isDraft()

		let errors = (report.isDraft() || report.isFuture()) && report.validateForSubmit()

		let isCancelled = report.cancelledReason ? true : false

		const formattedReportReleasedAt = moment(report.getReportReleasedAt()).format('D MMM YYYY, [at] h:mm a')

		return (
			<div className="report-show">
				<Breadcrumbs items={[['Report #' + report.id, Report.pathFor(report)]]} />
				<Messages error={this.state.error} success={this.state.success} />

				{report.isReleased() &&
					<Fieldset style={{textAlign: 'center' }}>
						<h4 className="text-danger">This report is RELEASED.</h4>
						<p>This report has been approved and released to the ANET community on {formattedReportReleasedAt}</p>
					</Fieldset>
				}

				{report.isRejected() &&
					<Fieldset style={{textAlign: 'center' }}>
						<h4 className="text-danger">This report was REJECTED. </h4>
						<p>You can review the comments below, fix the report and re-submit</p>
					</Fieldset>
				}

				{report.isDraft() &&
					<Fieldset style={{textAlign: 'center'}}>
						<h4 className="text-danger">This is a DRAFT report and hasn't been submitted.</h4>
						<p>You can review the draft below to make sure all the details are correct.</p>
						{(!hasAssignedPosition || !hasActivePosition) &&
							this.renderNoPositionAssignedText()
						}
						<div style={{textAlign: 'left'}}>
							{errors && errors.length > 0 &&
								this.renderValidationErrors(errors)
							}
						</div>
					</Fieldset>
				}

				{report.isPending() &&
					<Fieldset style={{textAlign: 'center'}}>
						<h4 className="text-danger">This report is PENDING approvals.</h4>
						<p>It won't be available in the ANET database until your <AnchorLink to="approvals">approval organization</AnchorLink> marks it as approved.</p>
					</Fieldset>
				}

				{report.isFuture() &&
					<Fieldset style={{textAlign: 'center'}}>
						<h4 className="text-success">This report is for an UPCOMING engagement.</h4>
						<p>After your engagement has taken place, edit and submit this document as an engagement report.</p>
						<div style={{textAlign: 'left'}}>
							{errors && errors.length > 0 &&
								this.renderValidationErrors(errors)
							}
						</div>
					</Fieldset>
				}

				{this.renderEmailModal()}

				<Form static formFor={report} horizontal>
					<Fieldset title={`Report #${report.id}`} className="show-report-overview" action={<div>
						{canEmail && <Button onClick={this.toggleEmailModal}>Email report</Button>}
						{canEdit && <LinkTo report={report} edit button="primary">Edit</LinkTo>}
						{canSubmit && errors.length === 0 && <Button bsStyle="primary" onClick={this.submitDraft}>Submit report</Button>}
					</div>
					}>

						<Form.Field id="intent" label="Summary" >
							<p><strong>Meeting goal:</strong> {report.intent}</p>
							{report.keyOutcomes && <p><span><strong>Key outcomes:</strong> {report.keyOutcomes}&nbsp;</span></p>}
							<p><strong>Next steps:</strong> {report.nextSteps}</p>
						</Form.Field>

						<Form.Field id="engagementDate" label="Engagement Date" getter={date => date && moment(date).format('D MMMM, YYYY')} />

						<Form.Field id="location" label="Location">
							{report.location && <LinkTo anetLocation={report.location} />}
						</Form.Field>

						{!isCancelled &&
							<Form.Field id="atmosphere" label="Atmospherics">
								{utils.sentenceCase(report.atmosphere)}
								{report.atmosphereDetails && ` – ${report.atmosphereDetails}`}
							</Form.Field>
						}
						{isCancelled &&
							<Form.Field id="cancelledReason" label="Cancelled Reason">
								{utils.sentenceCase(report.cancelledReason)}
							</Form.Field>
						}
						<Form.Field id="tags" label="Tags">
							{report.tags && report.tags.map((tag,i) => <Tag key={tag.id} tag={tag} />)}
						</Form.Field>
						<Form.Field id="author" label="Report author">
							<LinkTo person={report.author} />
						</Form.Field>
						<Form.Field id="advisorOrg" label={Settings.fields.advisor.org.name}>
							<LinkTo organization={report.advisorOrg} />
						</Form.Field>
						<Form.Field id="principalOrg" label={Settings.fields.principal.org.name}>
							<LinkTo organization={report.principalOrg} />
						</Form.Field>
					</Fieldset>

					<Fieldset title="Meeting attendees">
						<Table condensed className="borderless">
							<thead>
								<tr>
									<th style={{textAlign: 'center'}}>Primary</th>
									<th>Name</th>
									<th>Position</th>
									<th>Location</th>
									<th>Org</th>
								</tr>
							</thead>

							<tbody>
								{Person.map(report.attendees.filter(p => p.role === Person.ROLE.ADVISOR), person =>
									this.renderAttendeeRow(person)
								)}
								<tr><td colSpan={5}><hr className="attendee-divider" /></td></tr>
								{Person.map(report.attendees.filter(p => p.role === Person.ROLE.PRINCIPAL), person =>
									this.renderAttendeeRow(person)
								)}
							</tbody>
						</Table>
					</Fieldset>

					<Fieldset title={Settings.fields.task.longLabel} >
						<Table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Organization</th>
								</tr>
							</thead>

							<tbody>
								{Task.map(report.tasks, (task, idx) =>
									<tr key={task.id} id={"task_" + idx}>
										<td className="taskName" ><LinkTo task={task} >{task.shortName} - {task.longName}</LinkTo></td>
										<td className="taskOrg" ><LinkTo organization={task.responsibleOrg} /></td>
									</tr>
								)}
							</tbody>
						</Table>
					</Fieldset>

					{report.reportText &&
						<Fieldset title="Meeting discussion">
							<div dangerouslySetInnerHTML={{__html: report.reportText}} />
						</Fieldset>
					}

					{report.reportSensitiveInformation && report.reportSensitiveInformation.text &&
						<Fieldset title="Sensitive information">
							<div dangerouslySetInnerHTML={{__html: report.reportSensitiveInformation.text}} />
							{(report.authorizationGroups && report.authorizationGroups.length > 0 &&
								<div>
									<h5>Authorized groups:</h5>
									<Table>
										<thead>
											<tr>
												<th>Name</th>
												<th>Description</th>
											</tr>
										</thead>
										<tbody>
											{report.authorizationGroups.map(ag => {
												return (
													<tr key={ag.id}>
														<td>{ag.name}</td>
														<td>{ag.description}</td>
													</tr>
												)}
											)}
										</tbody>
									</Table>
								</div>
							) || (
								<h5>No groups are authorized!</h5>
							)}
						</Fieldset>
					}

					{report.showApprovals() &&
						<ReportApprovals report={report} fullReport={true} />
					}

					{canSubmit &&
						<Fieldset>
							<Col md={9}>
								{(errors && errors.length > 0) ?
									this.renderValidationErrors(errors)
									:
										<p>
											By pressing submit, this report will be sent to
											<strong> {Object.get(report, 'author.position.organization.name') || 'your organization approver'} </strong>
											to go through the approval workflow.
										</p>
								}
							</Col>

							<Col md={3}>
								<Button type="submit" bsStyle="primary" bsSize="large"
									onClick={this.submitDraft}
									disabled={errors && errors.length > 0}
									id="submitReportButton">
									Submit report
								</Button>
							</Col>
						</Fieldset>
					}

					<Fieldset className="report-sub-form" title="Comments">
						{report.comments.map(comment => {
							let createdAt = moment(comment.createdAt)
							return (
								<p key={comment.id}>
									<LinkTo person={comment.author} />
									<span title={createdAt.format('L LT')}> {createdAt.fromNow()}: </span>
									"{comment.text}"
								</p>
							)
						})}

						{!report.comments.length && <p>There are no comments yet.</p>}

						<Form formFor={this.state.newComment} horizontal onSubmit={this.submitComment} submitText={false} className="add-new-comment">
							<Form.Field id="text" placeholder="Type a comment here" label="Add a comment" componentClass="textarea" />

							<div className="right-button">
								<Button bsStyle="primary" type="submit">Save comment</Button>
							</div>
						</Form>
					</Fieldset>

					{canApprove && this.renderApprovalForm()}
				</Form>
				{currentUser.isAdmin() &&
					<div className="submit-buttons"><div>
						<ConfirmDelete
							onConfirmDelete={this.onConfirmDelete}
							objectType="report"
							objectDisplay={'#' + this.state.report.id}
							bsStyle="warning"
							buttonLabel="Delete report"
							className="pull-right" />
					</div></div>
				}
			</div>
		)
	}

	@autobind
	onConfirmDelete() {
		const operation = 'deleteReport'
		let graphql = operation + '(id: $id)'
		const variables = { id: this.state.report.id }
		const variableDef = '($id: Int!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				this.props.history.push({
					pathname: '/',
					state: {success: 'Report deleted'}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}

	@autobind
	renderApprovalForm() {
		return <Fieldset className="report-sub-form" title="Report approval">
			<h5>You can approve, reject, or edit this report</h5>

			<Form.Field
				id="approvalComment"
				componentClass="textarea"
				label="Approval comment"
				placeholder="Type a comment here; required for a rejection"
				getter={this.getApprovalComment}
				onChange={this.onChangeComment}
			/>

			<Button bsStyle="warning" onClick={this.handleRejectReport}>Reject with comment</Button>
			<div className="right-button">
				<LinkTo report={this.state.report} edit button>Edit report</LinkTo>
				<Button bsStyle="primary" onClick={this.handleApproveReport} className="approve-button"><strong>Approve</strong></Button>
			</div>
		</Fieldset>
	}

	@autobind
	renderAttendeeRow(person) {
		return <tr key={person.id}>
			<td className="primary-attendee">
				{person.primary && <Checkbox readOnly checked />}
			</td>
			<td>
				<img src={person.iconUrl()} alt={person.role} height={20} width={20} className="person-icon" />
				<LinkTo person={person} />
			</td>
			<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
			<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
			<td><LinkTo whenUnspecified="" organization={person.position && person.position.organization} /> </td>
		</tr>
	}

	@autobind
	renderEmailModal() {
		let email = this.state.email
		return <Modal show={this.state.showEmailModal} onHide={this.toggleEmailModal}>
			<Form formFor={email} onChange={this.onChange} submitText={false}>
				<Modal.Header closeButton>
					<Modal.Title>Email Report</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					{email.errors &&
						<Alert bsStyle="danger">{email.errors}</Alert>
					}

					<Form.Field id="to" />
					<HelpBlock>
						One or more email addresses, comma separated, e.g.:<br />
						<em>jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr. X" &lt;x@example.org&gt;</em>
					</HelpBlock>
					<Form.Field id="comment" componentClass="textarea" />
				</Modal.Body>

				<Modal.Footer>
					<Button bsStyle="primary" onClick={this.emailReport}>Send Email</Button>
				</Modal.Footer>
			</Form>
		</Modal>
	}

	@autobind
	toggleEmailModal() {
		this.setState({showEmailModal : !this.state.showEmailModal})
	}

	@autobind
	emailReport() {
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

		let graphql = 'emailReport(id: $id, email: $email)'
		const variables = {
			id: this.state.report.id,
			email: emailDelivery
		}
		const variableDef = '($id: Int!, $email: AnetEmailInput!)'
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

	@autobind
	submitDraft() {
		let graphql = 'submitReport(id: $id) { id }'
		const variables = {
			id: this.state.report.id
		}
		const variableDef = '($id: Int!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				this.updateReport()
				this.setState({error:null, success: 'Report submitted'})
			}).catch(error => {
				this.handleError(error)
			})
	}

	@autobind
	submitComment(event){
		let graphql = 'addComment(id: $id, comment: $comment) { id }'
		const variables = {
			id: this.state.report.id,
			comment: this.state.newComment
		}
		const variableDef = '($id: Int!, $comment: CommentInput!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				this.updateReport()
				this.setState({newComment:new Comment(), error:null, success: 'Comment saved'})
			}).catch(error => {
				this.handleError(error)
			})
		event.stopPropagation()
		event.preventDefault()
	}

	@autobind
	rejectReport() {
		if (this.state.approvalComment.text.length === 0){
			this.handleError({message:'Please include a comment when rejecting a report.'})
			return
		}

		this.state.approvalComment.text = 'REJECTED: ' + this.state.approvalComment.text
		let graphql = 'rejectReport(id: $id, comment: $comment) { id }'
		const variables = {
			id: this.state.report.id,
			comment: this.state.approvalComment
		}
		const variableDef = '($id: Int!, $comment: CommentInput!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				const { currentUser } = this.props
				const queryDetails = this.pendingMyApproval(currentUser)
				const message = 'Successfully rejected report.'
				deserializeQueryParams(SEARCH_OBJECT_TYPES.REPORTS, queryDetails.query, this.deserializeCallback.bind(this, message))
			}).catch(error => {
				this.handleError(error)
			})
	}

	handleRejectReport = (event) => {
		this.rejectReport()
		event.preventDefault()
		event.stopPropagation()
	}

	pendingMyApproval = (currentUser) => {
		return {
			title: "Reports pending my approval",
			query: { pendingApprovalOf: currentUser.id },
		}
	}

	deserializeCallback = (message, objectType, filters, text) => {
		// We update the Redux state
		this.props.setSearchQuery({
			objectType: objectType,
			filters: filters,
			text: text
		})
		this.props.history.push({
			pathname: '/search',
			state: {
				success: message,
			}
		})
	}

	@autobind
	approveReport() {
		const { approvalComment, report } = this.state
		const comment = (approvalComment.text.length > 0) ? approvalComment : {}
		const graphql = 'approveReport(id: $id, comment: $comment) { id }'
		const variableDef = '($id: Int!, $comment: CommentInput!)'
		const variables = {
			id: report.id,
			comment: comment
		}
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				const { currentUser } = this.props
				const queryDetails = this.pendingMyApproval(currentUser)
				const { report } = this.state
				const lastApproval = (report.approvalStep.nextStepId === null)
				const message = 'Successfully approved report.' + (lastApproval ? ' It has been added to the daily rollup' : '')
				deserializeQueryParams(SEARCH_OBJECT_TYPES.REPORTS, queryDetails.query, this.deserializeCallback.bind(this, message))
			})
			.catch(error => {
				this.handleError(error)
			})
	}

	handleApproveReport = (event) => {
		this.approveReport()
		event.preventDefault()
		event.stopPropagation()
	}

	@autobind
	onChange() {
		let report = this.state.report
		let email = this.state.email
		this.setState({report, email})
	}

	@autobind
	getApprovalComment(){
		return this.state.approvalComment.text
	}

	@autobind
	onChangeComment(value) {
		let approvalComment = this.state.approvalComment
		approvalComment.text = value.target.value
		this.setState({approvalComment})
	}

	@autobind
	updateReport() {
		this.fetchData(this.props)
		jumpToTop()
	}

	@autobind
	handleError(response) {
		this.setState({success: null, error: response})
		jumpToTop()
	}


	renderValidationErrors(errors) {
		let warning = this.state.report.isFuture() ?
			'You\'ll need to fill out these required fields before you can submit your final report:'
			:
			'The following errors must be fixed before submitting this report'
		let style = this.state.report.isFuture() ? "info" : "danger"
		return <Alert bsStyle={style}>
			{warning}
			<ul>
			{ errors.map((error,idx) =>
				<li key={idx}>{error}</li>
			)}
			</ul>
		</Alert>
	}
}

const ReportShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseReportShow currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(withRouter(ReportShow))
