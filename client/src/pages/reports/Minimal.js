import React from 'react'
import Page from 'components/Page'
import {Alert, Table, Button, Modal, Checkbox} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import moment from 'moment'
import utils from 'utils'

import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import Messages from 'components/Messages'
import Tag from 'components/Tag'

import API from 'api'
import {Report, Person, Poam} from 'models'

export default class ReportMinimal extends Page {
	static pageProps = {
		useNavigation: false,
		minimalHeader: true
	}

	static modelName = 'Report'

	constructor(props) {
		super(props)

		this.state = {
			report: new Report({id: props.params.id}),
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			report(id:${props.params.id}) {
				id, intent, engagementDate, atmosphere, atmosphereDetails
				keyOutcomes, reportText, nextSteps, cancelledReason

				state

				location { id, name }
				author {
					id, name
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
					id, name, role, primary
					position { id, name }
				}
				primaryAdvisor { id }
				primaryPrincipal { id }

				poams { id, shortName, longName, responsibleOrg { id, shortName} }

				comments {
					id, text, createdAt, updatedAt
					author { id, name, rank }
				}

				principalOrg { id, shortName, longName, identificationCode }
				advisorOrg { id, shortName, longName, identificationCode }

				approvalStatus {
					type, createdAt
					step { id , name
						approvers { id, name, person { id, name } }
					},
					person { id, name, rank}
				}

				approvalStep { name, approvers { id } }

				tags { id, name, description }
				reportSensitiveInformation { id, text }
			}
		`).then(data => {
			this.setState({report: new Report(data.report)})
		})
	}

	render() {
		let {report} = this.state

		let errors = report.isDraft() && report.validateForSubmit()
		let isCancelled = (report.cancelledReason) ? true : false

		return (
			<div>
				<Messages error={this.state.error} success={this.state.success} />

				{report.isRejected() &&
					<Fieldset style={{textAlign: 'center' }}>
						<h4 className="text-danger">This report was REJECTED. </h4>
					</Fieldset>
				}

				{report.isDraft() &&
					<Fieldset style={{textAlign: 'center'}}>
						<h4 className="text-danger">This report is in DRAFT state and hasn't been submitted.</h4>
						<p>You can review the draft below to make sure all the details are correct.</p>
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
						<p>It won't be available in the ANET database until your <a href="#approvals">approval organization</a> marks it as approved.</p>
					</Fieldset>
				}

				<Form static formFor={report} horizontal>
					<Fieldset title={`Report #${report.id}`} className="show-report-overview">
						<Form.Field id="intent" label="Summary" >
							<p><strong>Meeting goal:</strong> {report.intent}</p>
							{report.keyOutcomes && <p><span><strong>Key outcomes:</strong> {report.keyOutcomes}&nbsp;</span></p>}
							<p><strong>Next steps:</strong> {report.nextSteps}</p>
						</Form.Field>

						<Form.Field id="engagementDate" label="Date" getter={date => date && moment(date).format('D MMMM, YYYY')} />

						<Form.Field id="location" label="Location">
							<span>{report.location.name}</span>
						</Form.Field>

						{!isCancelled &&
							<Form.Field id="atmosphere" label="Atmospherics">
								{utils.upperCaseFirst(report.atmosphere)}
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
							<span>{report.author && report.author.name}</span>
						</Form.Field>
						<Form.Field id="advisorOrg" label="Advisor Org">
							<span>{report.advisorOrg && report.advisorOrg.shortName }</span>
						</Form.Field>
						<Form.Field id="principalOrg" label="Principal Org">
							<span>{report.principalOrg && report.principalOrg.shortName }</span>
						</Form.Field>
					</Fieldset>

					<Fieldset title="Meeting attendees">
						<Table condensed className="borderless">
							<thead>
								<tr>
									<th style={{textAlign: 'center'}}>Primary</th>
									<th>Name</th>
									<th>Position</th>
								</tr>
							</thead>

							<tbody>
								{Person.map(report.attendees.filter(p => p.role === "ADVISOR"), person =>
									this.renderAttendeeRow(person)
								)}
								<tr><td colSpan={3}><hr className="attendee-divider" /></td></tr>
								{Person.map(report.attendees.filter(p => p.role === "PRINCIPAL"), person =>
									this.renderAttendeeRow(person)
								)}
							</tbody>
						</Table>
					</Fieldset>

					<Fieldset title="Plan of Action and Milestones / Pillars">
						<Table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Organization</th>
								</tr>
							</thead>

							<tbody>
								{Poam.map(report.poams, (poam, idx) =>
									<tr key={poam.id} id={"poam_" + idx}>
										<td className="poamName" >{poam.shortName} - {poam.longName}</td>
										<td className="poamOrg" >{poam.responsibleOrg && poam.responsibleOrg.shortName }</td>
									</tr>
								)}
							</tbody>
						</Table>
					</Fieldset>

					<Fieldset title="Meeting discussion">
						<div dangerouslySetInnerHTML={{__html: report.reportText}} />
					</Fieldset>

					{report.reportSensitiveInformation && report.reportSensitiveInformation.text &&
						<Fieldset title="Sensitive information">
							<div dangerouslySetInnerHTML={{__html: report.reportSensitiveInformation.text}} />
						</Fieldset>
					}

					{report.isPending() && this.renderApprovals()}

					<Fieldset title="Comments">
						{report.comments.map(comment => {
							let createdAt = moment(comment.createAt)
							return (
								<p key={comment.id}>
									{comment.author.name}
									<span title={createdAt.format('L LT')}> {createdAt.fromNow()}: </span>
									"{comment.text}"
								</p>
							)
						})}

						{!report.comments.length && 'There are no comments yet.'}
					</Fieldset>
				</Form>
			</div>
		)
	}

	@autobind
	renderApprovals(canApprove) {
		let report = this.state.report
		return <Fieldset>
			<a name="approvals" />
			<legend>Approvals</legend>
			{report.approvalStatus.map(action =>
				this.renderApprovalAction(action)
			)}
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
				{person.name}
			</td>
				<td>{person.position && person.position.name}</td>
		</tr>
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
	updateReport(json) {
		this.fetchData(this.props)
		window.scrollTo(0, 0)
	}

	@autobind
	handleError(response) {
		this.setState({error: response})
		window.scrollTo(0, 0)
	}

	@autobind
	renderApprovalAction(action) {
		let step = action.step
		return <div key={step.id}>
			<Button onClick={this.showApproversModal.bind(this, step)}>
				{step.name}
			</Button>
			<Modal show={step.showModal} onHide={this.closeApproversModal.bind(this, step)}>
				<Modal.Header closeButton>
					<Modal.Title>Approvers for {step.name}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<ul>
					{step.approvers.map(p =>
						<li key={p.id}>{p.name} - {p.person && p.person.name}</li>
					)}
					</ul>
				</Modal.Body>
			</Modal>
	 	{action.type ?
				<span> {action.type} by {action.person.name} <small>{moment(action.createdAt).format('D MMM YYYY')}</small></span>
				:
				<span className="text-danger"> Pending</span>
			}
		</div>
	}

	renderValidationErrors(errors) {
		return <Alert bsStyle="danger">
			The following errors must be fixed before submitting this report
			<ul>
			{ errors.map((error,idx) =>
				<li key={idx}>{error}</li>
			)}
			</ul>
		</Alert>
	}

	@autobind
	showApproversModal(step) {
		step.showModal = true
		this.setState(this.state)
	}

	@autobind
	closeApproversModal(step) {
		step.showModal = false
		this.setState(this.state)
	}
}
