import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Button, Modal, Table} from 'react-bootstrap'

import { Formik, Form, Field, FieldArray } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import MultiSelector from 'components/MultiSelector'
import TaskTable from 'components/TaskTable'
import LinkTo from 'components/LinkTo'
import Messages from 'components/Messages'

import API from 'api'
import {Organization, Person, Position, Task} from 'models'
import Settings from 'Settings'

import DictionaryField from '../../HOC/DictionaryField'

import ORGANIZATIONS_ICON from 'resources/organizations.png'
import POSITIONS_ICON from 'resources/positions.png'
import TASKS_ICON from 'resources/tasks.png'
import REMOVE_ICON from 'resources/delete.png'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

const ApproverTable = (props) => (
	<Table striped condensed hover responsive>
		<thead>
			<tr>
				<th>Name</th>
				<th>Position</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{props.approvers.map((approver, approverIndex) =>
				<tr key={approver.uuid}>
					<td><LinkTo person={approver.person} target="_blank" /></td>
					<td><LinkTo position={approver} target="_blank" /></td>
					<td onClick={() => props.onDelete(approver)}>
						<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove approver" /></span>
					</td>
				</tr>
			)}
		</tbody>
	</Table>
)

class BaseOrganizationForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object.isRequired,
		title: PropTypes.string,
		edit: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		initialValues: new Organization(),
		title: '',
		edit: false,
	}

	statusButtons = [
		{
			id: 'statusActiveButton',
			value: Organization.STATUS.ACTIVE,
			label: 'Active',
		},
		{
			id: 'statusInactiveButton',
			value: Organization.STATUS.INACTIVE,
			label: 'Inactive'
		},
	]
	typeButtons = [
		{
			id: 'typeAdvisorButton',
			value: Organization.TYPE.ADVISOR_ORG,
			label: Settings.fields.advisor.org.name,
		},
		{
			id: 'typePrincipalButton',
			value: Organization.TYPE.PRINCIPAL_ORG,
			label: Settings.fields.principal.org.name,
		},
	]
	IdentificationCodeFieldWithLabel = DictionaryField(Field)
	LongNameWithLabel = DictionaryField(Field)
	state = {
		error: null,
		showAddApprovalStepAlert: false,
	}

	render() {
		const { currentUser, edit, title, ...myFormProps } = this.props

		return (
			<Formik
				enableReinitialize={true}
				onSubmit={this.onSubmit}
				validationSchema={Organization.yupSchema}
				isInitialValid={() => Organization.yupSchema.isValidSync(this.props.initialValues)}
				{...myFormProps}
			>
			{({
				handleSubmit,
				isSubmitting,
				isValid,
				dirty,
				errors,
				setFieldValue,
				values,
				submitForm
			}) => {
				const isAdmin = currentUser && currentUser.isAdmin()
				const isAdvisorOrg = (values.type === Organization.TYPE.ADVISOR_ORG)
				const isPrincipalOrg = (values.type === Organization.TYPE.PRINCIPAL_ORG)
				const orgSettings = isPrincipalOrg ? Settings.fields.principal.org : Settings.fields.advisor.org
				const orgSearchQuery = {status: Organization.STATUS.ACTIVE, type: values.type}
				// Reset the parentOrg property when changing the organization type
				if (values.parentOrg && values.parentOrg.type && (values.parentOrg.type !== values.type)) {
					values.parentOrg = {}
				}
				const action = (isAdmin || !isPrincipalOrg) && <div>
					<Button key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Organization</Button>
				</div>
				return <div>
					<NavigationWarning isBlocking={dirty} />
					<Messages error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={title} action={action} />
						<Fieldset>
							{!isAdmin
								? <Field
									name="type"
									component={FieldHelper.renderReadonlyField}
									humanValue={Organization.humanNameOfType}
								/>
								: <Field
									name="type"
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.typeButtons}
								/>
							}

							{(!isAdmin && isPrincipalOrg)
								? <React.Fragment>
									<Field
										name="parentOrg"
										component={FieldHelper.renderReadonlyField}
										label={Settings.fields.organization.parentOrg}
										humanValue={values.parentOrg &&
											<LinkTo organization={values.parentOrg}>
												{values.parentOrg.shortName} {values.parentOrg.longName} {values.parentOrg.identificationCode}
											</LinkTo>
										}
									/>
									<Field
										name="shortName"
										component={FieldHelper.renderReadonlyField}
										label={Settings.fields.organization.shortName}
									/>
									<this.LongNameWithLabel
										dictProps={orgSettings.longName}
										name="longName"
										component={FieldHelper.renderReadonlyField}
									/>
									<Field
										name="status"
										component={FieldHelper.renderReadonlyField}
										humanValue={Organization.humanNameOfStatus}
									/>
								</React.Fragment>
								: <React.Fragment>
									<Field
										name="parentOrg"
										component={FieldHelper.renderSpecialField}
										label={Settings.fields.organization.parentOrg}
										onChange={value => setFieldValue('parentOrg', value)}
										addon={ORGANIZATIONS_ICON}
										widget={
											<Autocomplete
												objectType={Organization}
												valueKey="shortName"
												fields={Organization.autocompleteQuery}
												placeholder="Start typing to search for a higher level organization..."
												queryParams={orgSearchQuery}
												template={org => <span>{org.shortName} - {org.longName} {org.identificationCode}</span>}
											/>
										}
									/>
									<Field
										name="shortName"
										component={FieldHelper.renderInputField}
										label={Settings.fields.organization.shortName}
										placeholder="e.g. EF1.1"
									/>
									<this.LongNameWithLabel
										dictProps={orgSettings.longName}
										name="longName"
										component={FieldHelper.renderInputField}
									/>
									<Field
										name="status"
										component={FieldHelper.renderButtonToggleGroup}
										buttons={this.statusButtons}
									/>
								</React.Fragment>
							}

							{!isAdmin
								? <this.IdentificationCodeFieldWithLabel
									dictProps={orgSettings.identificationCode}
									name="identificationCode"
									component={FieldHelper.renderReadonlyField}
								/>
								: <this.IdentificationCodeFieldWithLabel
									dictProps={orgSettings.identificationCode}
									name="identificationCode"
									component={FieldHelper.renderInputField}
								/>
							}
						</Fieldset>

						{isAdvisorOrg &&
							<div>
								<Fieldset title="Approval process">
									<FieldArray
										name="approvalSteps"
										render={arrayHelpers => (
											<div>
												<Button className="pull-right" onClick={() => this.addApprovalStep(arrayHelpers, values)} bsStyle="primary" id="addApprovalStepButton" >
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

												{values.approvalSteps.map((step, index) => (
													this.renderApprovalStep(arrayHelpers, setFieldValue, step, index)
												))}
											</div>
										)}
									/>
								</Fieldset>

								{Organization.isTaskEnabled(values.shortName) &&
									<Fieldset title={Settings.fields.task.longLabel} className="tasks-selector">
										<MultiSelector
											items={values.tasks}
											objectType={Task}
											queryParams={{status: Task.STATUS.ACTIVE}}
											placeholder={`Start typing to search for ${Settings.fields.task.shortLabel}...`}
											fields={Task.autocompleteQuery}
											template={Task.autocompleteTemplate}
											addFieldName='tasks'
											addFieldLabel={Settings.fields.task.shortLabel}
											addon={TASKS_ICON}
											renderSelected={<TaskTable tasks={values.tasks} showDelete={true} />}
											onChange={value => setFieldValue('tasks', value)}
										/>
									</Fieldset>
								}
							</div>
						}

						<div className="submit-buttons">
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
							{(isAdmin || !isPrincipalOrg) && <div>
								<Button id="formBottomSubmit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Organization</Button>
							</div>}
						</div>
					</Form>
				</div>
			}}
			</Formik>
		)
	}

	renderApprovalStep = (arrayHelpers, setFieldValue, step, index) => {
		const approvers = step.approvers

		return <Fieldset title={`Step ${index + 1}`} key={index}>
			<Button className="pull-right" title="Remove this step" onClick={() => arrayHelpers.remove(index)}>
				<img src={REMOVE_ICON} height={14} alt="Remove this step" />
			</Button>

			<Field
				name={`approvalSteps.${index}.name`}
				component={FieldHelper.renderInputField}
				label="Step name"
			/>

			<MultiSelector
				items={approvers}
				objectType={Position}
				queryParams={{status: Position.STATUS.ACTIVE, type: [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR], matchPersonName: true}}
				placeholder="Search for the approver's position"
				fields="uuid, name, code, type, person { uuid, name, rank, role }"
				template={position =>
					<span> {position.person && <span> <LinkTo person={position.person} isLink={false}/> - </span>} <LinkTo position={position} isLink={false}/> {position.code && <span> - {position.code} </span>} </span>
				}
				addFieldName={`approvalSteps.${index}.approvers`}
				addFieldLabel="Add an approver"
				addon={POSITIONS_ICON}
				renderSelected={<ApproverTable approvers={approvers} />}
				onChange={value => setFieldValue(`approvalSteps.${index}.approvers`, value)}
			/>
		</Fieldset>
	}

	hideAddApprovalStepAlert = () => {
		this.setState({showAddApprovalStepAlert: false})
	}

	addApprovalStep = (arrayHelpers, values) => {
		const approvalSteps = values.approvalSteps || []

		for (let i = 0; i < approvalSteps.length; i++) {
			const step = approvalSteps[i]
			if (!step.name || !step.approvers || step.approvers.length === 0) {
				this.setState({showAddApprovalStepAlert: true})
				return
			}
		}

		arrayHelpers.push({name: '', approvers: []})
	}

	onCancel = () => {
		this.props.history.goBack()
	}

	onSubmit = (values, form) => {
		return this.save(values, form)
			.then(response => this.onSubmitSuccess(response, values, form))
			.catch(error => {
				this.setState({error})
				jumpToTop()
			})
	}

	onSubmitSuccess = (response, values, form) => {
		const { edit } = this.props
		const operation = edit ? 'updateOrganization' : 'createOrganization'
		const organization = new Organization({uuid: (response[operation].uuid ? response[operation].uuid : this.props.initialValues.uuid)})
		// After successful submit, reset the form in order to make sure the dirty
		// prop is also reset (otherwise we would get a blocking navigation warning)
		form.resetForm()
		this.props.history.replace(Organization.pathForEdit(organization))
		this.props.history.push({
			pathname: Organization.pathFor(organization),
			state: {
				success: 'Organization saved',
			}
		})
	}

	save = (values, form) => {
		const organization = Object.without(new Organization(values), 'childrenOrgs', 'positions')
		organization.parentOrg = utils.getReference(organization.parentOrg)
		const { edit } = this.props
		const operation = edit ? 'updateOrganization' : 'createOrganization'
		let graphql = operation + '(organization: $organization)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { organization: organization }
		const variableDef = '($organization: OrganizationInput!)'
		return API.mutation(graphql, variables, variableDef)
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
