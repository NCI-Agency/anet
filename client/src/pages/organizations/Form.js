import PropTypes from 'prop-types'
import React from 'react'
import {Button, Modal, Table} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import Autocomplete from 'components/Autocomplete'
import TaskSelector from 'components/TaskSelector'
import LinkTo from 'components/LinkTo'
import Messages from 'components/Messages'

import API from 'api'
import Settings from 'Settings'
import {Organization, Person, Position} from 'models'

import DictionaryField from '../../HOC/DictionaryField'

import REMOVE_ICON from 'resources/delete.png'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

class BaseOrganizationForm extends ValidatableFormWrapper {
	static propTypes = {
		organization: PropTypes.object,
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)
		this.state = {
			success: null,
			error: null,
			isBlocking: false,
			showAddApprovalStepAlert: false,
		}
		this.IdentificationCodeFieldWithLabel = DictionaryField(Form.Field)
		this.LongNameWithLabel = DictionaryField(Form.Field)
	}

	render() {
		const { organization, edit, currentUser } = this.props
		let {approvalSteps} = organization
		let isAdmin = currentUser && currentUser.isAdmin()
		let isPrincipalOrg = (organization.type === Organization.TYPE.PRINCIPAL_ORG)
		const {ValidatableForm, RequiredField} = this

		const orgSettings = isPrincipalOrg ? Settings.fields.principal.org : Settings.fields.advisor.org
		const submitText = (isPrincipalOrg && !isAdmin) ? false : "Save organization"

		return <div>
			<NavigationWarning isBlocking={this.state.isBlocking} />

			<ValidatableForm formFor={organization}
			onChange={this.onChange}
			onSubmit={this.onSubmit}
			submitText={submitText}
			horizontal>

			<Messages error={this.state.error} />

			<Fieldset title={edit ? `Edit Organization ${organization.shortName}` : "Create a new Organization"}>
				<Form.Field id="type">
					<ButtonToggleGroup>
						<Button id="advisorOrgButton" disabled={!isAdmin} value={Organization.TYPE.ADVISOR_ORG}>{Settings.fields.advisor.org.name}</Button>
						<Button id="principalOrgButton" disabled={!isAdmin} value={Organization.TYPE.PRINCIPAL_ORG}>{Settings.fields.principal.org.name}</Button>
					</ButtonToggleGroup>
				</Form.Field>

				<Form.Field id="parentOrg" label="Parent organization">
					<Autocomplete
						objectType={Organization}
						valueKey="shortName"
						fields={Organization.autocompleteQuery}
						placeholder="Start typing to search for a higher level organization..."
						queryParams={{status: Organization.STATUS.ACTIVE, type: organization.type}}
						disabled={isPrincipalOrg && !isAdmin}
					/>
				</Form.Field>

				<RequiredField id="shortName" label="Name" placeholder="e.g. EF1.1" disabled={isPrincipalOrg && !isAdmin} />
				<this.LongNameWithLabel dictProps={orgSettings.longName} id="longName" disabled={isPrincipalOrg && !isAdmin} />

				<Form.Field id="status" >
					<ButtonToggleGroup>
						<Button id="statusActiveButton" disabled={isPrincipalOrg && !isAdmin} value={ Organization.STATUS.ACTIVE }>Active</Button>
						<Button id="statusInactiveButton" disabled={isPrincipalOrg && !isAdmin} value={ Organization.STATUS.INACTIVE }>Inactive</Button>
					</ButtonToggleGroup>
				</Form.Field>

				<this.IdentificationCodeFieldWithLabel dictProps={orgSettings.identificationCode} id="identificationCode" disabled={!isAdmin}/>
			</Fieldset>

			{organization.isAdvisorOrg() && <div>
				<Fieldset title="Approval process">
					<Button className="pull-right" onClick={this.addApprovalStep} bsStyle="primary" id="addApprovalStepButton" >
						Add an Approval Step
					</Button>
					<Modal show={this.state.showAddApprovalStepAlert} onHide={this.hideAddApprovalStepAlert}>
						<Modal.Header closeButton>
							<Modal.Title>Step not added</Modal.Title>
						</Modal.Header>
						<Modal.Body>
							Please complete all approval steps; there already is an approval step that is not completely filled in.
						</Modal.Body>
						<Modal.Footer>
							<Button className="pull-right" onClick={this.hideAddApprovalStepAlert} bsStyle="primary">OK</Button>
						</Modal.Footer>
					</Modal>

					{approvalSteps && approvalSteps.map((step, index) =>
						this.renderApprovalStep(step, index)
					)}
				</Fieldset>

				{ organization.isTaskEnabled() &&
					<TaskSelector tasks={organization.tasks} onChange={this.onChange} />
				}
			</div>}
		</ValidatableForm>
		</div>
	}

	renderApprovalStep(step, index) {
		const approvers = step.approvers
		const { RequiredField } = this

		return <Fieldset title={`Step ${index + 1}`} key={index}>
			<Button className="pull-right" onClick={this.removeApprovalStep.bind(this, index)}>
				X
			</Button>

			<RequiredField id={`approvalStepName${index}`}
				label="Step name"
				value={step.name}
				onChange={(event) => this.setStepName(index, event)} />

			<Form.Field id="addApprover" label="Add an approver" value={approvers}>
				<Autocomplete valueKey="name"
					placeholder="Search for the approver's position"
					objectType={Position}
					fields="id, name, code, type, person { id, name, rank }"
					template={position => 
						<span> {position.person && <span> <LinkTo person={position.person} isLink={false}/> - </span>} <LinkTo position={position} isLink={false}/> {position.code && <span> - {position.code} </span>} </span>
					}
					queryParams={{status: Position.STATUS.ACTIVE, type: [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR], matchPersonName: true}}
					onChange={this.addApprover.bind(this, index)}
					clearOnSelect={true} />

				<Table striped>
					<thead>
						<tr>
							<th>Name</th>
							<th>Position</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{approvers.map((approver, approverIndex) =>
							<tr key={approver.id} id={`step_${index}_approver_${approverIndex}`} >
								<td><LinkTo person={approver.person} target="_blank" /></td>
								<td><LinkTo position={approver} target="_blank" /></td>
								<td onClick={this.removeApprover.bind(this, approver, index)}>
									<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove approver" /></span>
								</td>
							</tr>
						)}
					</tbody>
				</Table>
			</Form.Field>
		</Fieldset>
	}

	@autobind
	addApprover(index, position) {
		if (!position || !position.id) {
			return
		}

		let org = this.props.organization
		let step = org.approvalSteps[index]
		let newApprovers = step.approvers.slice()
		newApprovers.push(position)
		step.approvers = newApprovers

		this.onChange()
	}

	@autobind
	removeApprover(approver, index) {
		let step = this.props.organization.approvalSteps[index]
		let approvers = step.approvers
		let approverIndex = approvers.findIndex(m => m.id === approver.id )

		if (approverIndex !== -1) {
			approvers.splice(approverIndex, 1)
			this.onChange()
		}
	}

	@autobind
	setStepName(index, event) {
		let name = event && event.target ? event.target.value : event
		let step = this.props.organization.approvalSteps[index]
		step.name = name

		this.onChange()
	}

	@autobind
	hideAddApprovalStepAlert() {
		this.setState({showAddApprovalStepAlert: false})
	}

	@autobind
	addApprovalStep() {
		let org = this.props.organization
		let approvalSteps = org.approvalSteps || []

		for (let i = 0; i < approvalSteps.length; i++) {
			const step = approvalSteps[i]
			if (!step.name || !step.approvers || step.approvers.length === 0) {
				this.setState({showAddApprovalStepAlert: true})
				return
			}
		}

		approvalSteps.push({name: '', approvers: []})
		this.onChange()
	}

	@autobind
	removeApprovalStep(index) {
		let steps = this.props.organization.approvalSteps
		steps.splice(index, 1)
		this.onChange()
	}

	@autobind
	onChange() {
		this.setState({
			isBlocking: this.formHasUnsavedChanges(this.props.organization, this.props.original),
		})
	}

	@autobind
	onSubmit(event) {
		let organization = Object.without(this.props.organization, 'childrenOrgs', 'positions')
		for (var i = 0; i < this.props.organization.approvalSteps.length; i++) {
			organization = Object.without(organization, 'approvalStepName' + i)
		}
		organization.parentOrg = utils.getReference(organization.parentOrg)
		let edit = this.props.edit
		const operation = edit ? 'updateOrganization' : 'createOrganization'
		let graphql = operation + '(organization: $organization)'
		graphql += edit ? '' : ' { id }'
		const variables = { organization: organization }
		const variableDef = '($organization: OrganizationInput!)'
		this.setState({isBlocking: false})
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (data[operation].id) {
					organization.id = data[operation].id
				}
				this.props.history.replace(Organization.pathForEdit(organization))
				this.props.history.push({
					pathname: Organization.pathFor(organization),
					state: {
						success: 'Organization saved',
					}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}
}

const OrganizationForm = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseOrganizationForm currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(OrganizationForm)
