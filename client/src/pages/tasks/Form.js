import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Button} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import NewAutocomplete from 'components/NewAutocomplete'
import Messages from'components/Messages'
import DictionaryField from '../../HOC/DictionaryField'

import Settings from 'Settings'
import API from 'api'
import {Organization, Person, Task} from 'models'
import _isEmpty from 'lodash/isEmpty'

import CALENDAR_ICON from 'resources/calendar.png'
import ORGANIZATION_ICON from 'resources/organizations.png'
import TASK_ICON from 'resources/tasks.png'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

class BaseTaskForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object.isRequired,
		title: PropTypes.string,
		edit: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		initialValues: new Task(),
		title: '',
		edit: false,
	}

	statusButtons = [
		{
			id: 'statusActiveButton',
			value: Task.STATUS.ACTIVE,
			label: 'Active',
		},
		{
			id: 'statusInactiveButton',
			value: Task.STATUS.INACTIVE,
			label: 'Inactive'
		},
	]
	TaskCustomFieldRef1 = DictionaryField(Field)
	TaskCustomField = DictionaryField(Field)
	PlannedCompletionField = DictionaryField(Field)
	ProjectedCompletionField = DictionaryField(Field)
	TaskCustomFieldEnum1 = DictionaryField(Field)
	TaskCustomFieldEnum2 = DictionaryField(Field)
	state = {
		error: null,
	}

	render() {
		const { currentUser, edit, title, ...myFormProps } = this.props

		const taskShortLabel = Settings.fields.task.shortLabel
		const customFieldRef1 = Settings.fields.task.customFieldRef1
		const customFieldEnum1 = Settings.fields.task.customFieldEnum1
		const customFieldEnum2 = Settings.fields.task.customFieldEnum2
		const plannedCompletion = Settings.fields.task.plannedCompletion
		const projectedCompletion = Settings.fields.task.projectedCompletion

		const orgSearchQuery = {
			status: Organization.STATUS.ACTIVE,
			type: Organization.TYPE.ADVISOR_ORG,
		}

		if (currentUser && currentUser.isSuperUser() && !currentUser.isAdmin()) {
			Object.assign(orgSearchQuery, {
				parentOrgUuid: currentUser.position.organization.uuid,
				parentOrgRecursively: true,
			})
		}
		return (
			<Formik
				enableReinitialize={true}
				onSubmit={this.onSubmit}
				validate={this.validate}
				isInitialValid={() => this.isValid(this.props.initialValues)}
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
				const action = <div>
					<Button key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save {taskShortLabel}</Button>
				</div>
				return <div>
					<NavigationWarning isBlocking={dirty} />
					<Messages error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={this.props.title} action={action} />
						<Fieldset>
							<Field
								name="shortName"
								label={`${taskShortLabel} number`}
								component={FieldHelper.renderInputField}
							/>

							<Field
								name="longName"
								label={`${taskShortLabel} description`}
								component={FieldHelper.renderInputField}
							/>

							<Field
								name="status"
								component={FieldHelper.renderButtonToggleGroup}
								buttons={this.statusButtons}
							/>

							<Field
								name="responsibleOrg"
								label="Responsible organization"
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('responsibleOrg', value)}
								addon={ORGANIZATION_ICON}
							>
								<NewAutocomplete
									objectType={Organization}
									valueKey="shortName"
									fields={Organization.autocompleteQuery}
									placeholder={`Select a responsible organization for this ${taskShortLabel}`}
									queryParams={orgSearchQuery}
								/>
							</Field>

							{customFieldRef1 &&
								<this.TaskCustomFieldRef1
									dictProps={customFieldRef1}
									name="customFieldRef1"
									component={FieldHelper.renderSpecialField}
									onChange={value => setFieldValue('customFieldRef1', value)}
									addon={TASK_ICON}
								>
									<NewAutocomplete
										objectType={Task}
										valueKey="shortName"
										fields={Task.autocompleteQuery}
										template={Task.autocompleteTemplate}
										placeholder={customFieldRef1.placeholder}
										queryParams={{}}
									/>
								</this.TaskCustomFieldRef1>
							}

							<this.TaskCustomField
								dictProps={Settings.fields.task.customField}
								name="customField"
								component={FieldHelper.renderInputField}
							/>

							{plannedCompletion &&
								<this.PlannedCompletionField
									dictProps={plannedCompletion}
									name="plannedCompletion"
									component={FieldHelper.renderSpecialField}
									onChange={(value, formattedValue) => setFieldValue('plannedCompletion', value)}
									addon={CALENDAR_ICON}
								>
									<DatePicker showTodayButton placeholder={plannedCompletion.placeholder} dateFormat="DD/MM/YYYY" showClearButton={false} />
								</this.PlannedCompletionField>
							}

							{projectedCompletion &&
								<this.ProjectedCompletionField
									dictProps={projectedCompletion}
									name="projectedCompletion"
									component={FieldHelper.renderSpecialField}
									onChange={(value, formattedValue) => setFieldValue('projectedCompletion', value)}
									addon={CALENDAR_ICON}
								>
									<DatePicker showTodayButton placeholder={projectedCompletion.placeholder} dateFormat="DD/MM/YYYY" showClearButton={false} />
								</this.ProjectedCompletionField>
							}

							{customFieldEnum1 &&
								<this.TaskCustomFieldEnum1
									dictProps={Object.without(customFieldEnum1, 'enum')}
									name="customFieldEnum1"
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.customEnumButtons(customFieldEnum1.enum)}
								/>
							}

							{customFieldEnum2 &&
								<this.TaskCustomFieldEnum2
									dictProps={Object.without(customFieldEnum2, 'enum')}
									name="customFieldEnum2"
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.customEnumButtons(customFieldEnum2.enum)}
								/>
							}
						</Fieldset>

						<div className="submit-buttons">
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
							<div>
								<Button id="formBottomSubmit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save {taskShortLabel}</Button>
							</div>
						</div>
					</Form>
				</div>
			}}
			</Formik>
		)
	}

	isValid = (values) => {
		return _isEmpty(this.validate(values))
	}

	validate = (values) => {
		let errors = {}
		if (!values.shortName) {
			errors.shortName = 'Required'
		}
		if (!values.longName) {
			errors.longName = 'Required'
		}
		if (!values.status) {
			errors.status = 'Required'
		}
		if (values.responsibleOrg && (typeof values.responsibleOrg !== 'object')) {
			errors.responsibleOrg =  'Organization not found in database'
		}
		if (values.customFieldRef1 && (typeof values.customFieldRef1 !== 'object')) {
			errors.customFieldRef1 =  'Task not found in database'
		}
		return errors
	}

	customEnumButtons = (list) => {
		const buttons = []
		for (const key in list) {
			if (list.hasOwnProperty(key)) {
				buttons.push({
					id: key,
					value: key,
					label: list[key],
				})
			}
		}
	    return buttons
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
		const operation = edit ? 'updateTask' : 'createTask'
		const task = new Task({uuid: (response[operation].uuid ? response[operation].uuid : this.props.initialValues.uuid)})
		// After successful submit, reset the form in order to make sure the dirty
		// prop is also reset (otherwise we would get a blocking navigation warning)
		form.resetForm()
		this.props.history.replace(Task.pathForEdit(task))
		this.props.history.push({
			pathname: Task.pathFor(task),
			state: {
				success: 'Task saved',
			}
		})
	}

	save = (values, form) => {
		const task = new Task(values)
		task.responsibleOrg = utils.getReference(task.responsibleOrg)
		task.customFieldRef1 = utils.getReference(task.customFieldRef1)
		const { edit } = this.props
		const operation = edit ? 'updateTask' : 'createTask'
		let graphql = operation + '(task: $task)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { task: task }
		const variableDef = '($task: TaskInput!)'
		return API.mutation(graphql, variables, variableDef)
	}
}

const TaskForm = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseTaskForm currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(TaskForm)
