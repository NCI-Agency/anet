import PropTypes from 'prop-types'
import React from 'react'
import autobind from 'autobind-decorator'

import {Button} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import Messages from'components/Messages'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import DictionaryField from '../../HOC/DictionaryField'

import Settings from 'Settings'
import API from 'api'
import {Organization, Person, Position, Task} from 'models'

import CALENDAR_ICON from 'resources/calendar.png'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

const customEnumButtons = (list) => {
	let buttons = []
	for (const key in list) {
		if (list.hasOwnProperty(key)) {
			let value = list[key]
			buttons.push(<Button id="statusActiveButton" key={key} value={key}>{value}</Button>)
		}
	  }
    return buttons
}

class BaseTaskForm extends ValidatableFormWrapper {
	static propTypes = {
		task: PropTypes.object.isRequired,
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)
		this.TaskCustomFieldRef1 = DictionaryField(Form.Field)
		this.TaskCustomField = DictionaryField(Form.Field)
		this.PlannedCompletionField = DictionaryField(Form.Field)
		this.ProjectedCompletionField = DictionaryField(Form.Field)
		this.TaskCustomFieldEnum1 = DictionaryField(Form.Field)
		this.TaskCustomFieldEnum2 = DictionaryField(Form.Field)

		this.state = {
			success: null,
			error: null,
			isBlocking: false,
		}
	}

	render() {
		const { task, edit, currentUser } = this.props
		const taskShortLabel = Settings.fields.task.shortLabel
		const customFieldRef1 = Settings.fields.task.customFieldRef1
		const customFieldEnum1 = Settings.fields.task.customFieldEnum1
		const customFieldEnum2 = Settings.fields.task.customFieldEnum2
		const plannedCompletion = Settings.fields.task.plannedCompletion
		const projectedCompletion = Settings.fields.task.projectedCompletion
		const orgSearchQuery = {status: Organization.STATUS.ACTIVE}

		orgSearchQuery.type = Organization.TYPE.ADVISOR_ORG
		if (currentUser && currentUser.position && currentUser.position.type === Position.TYPE.SUPER_USER) {
			orgSearchQuery.parentOrgId = currentUser.position.organization.id
			orgSearchQuery.parentOrgRecursively = true
		}
		const {ValidatableForm, RequiredField} = this
		return (
			<div>
				<NavigationWarning isBlocking={this.state.isBlocking} />

				<Messages error={this.state.error} success={this.state.success} />

				<ValidatableForm
					formFor={task}
					onChange={this.onChange}
					onSubmit={this.onSubmit}
					submitText={`Save ${taskShortLabel}`}
					horizontal>

					<Fieldset title={edit ?
						`Edit ${taskShortLabel} ${task.shortName}`
						:
						`Create a new ${taskShortLabel}`
					}>
						<RequiredField id="shortName" label={`${taskShortLabel} number`} />
						<RequiredField id="longName" label={`${taskShortLabel} description`} />

						<RequiredField id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value={ Task.STATUS.ACTIVE }>Active</Button>
								<Button id="statusInactiveButton" value={ Task.STATUS.INACTIVE }>Inactive</Button>
							</ButtonToggleGroup>
						</RequiredField>

						<Form.Field id="responsibleOrg" label="Responsible organization">
							<Autocomplete
								objectType={Organization}
								valueKey="shortName"
								fields={Organization.autocompleteQuery}
								placeholder={`Select a responsible organization for this ${taskShortLabel}`}
								queryParams={orgSearchQuery}
							/>
						</Form.Field>

						{customFieldRef1 &&
							<this.TaskCustomFieldRef1 dictProps={customFieldRef1} id="customFieldRef1">
								<Autocomplete
									objectType={Task}
									valueKey="shortName"
									fields={Task.autocompleteQuery}
									template={Task.autocompleteTemplate}
									placeholder={customFieldRef1.placeholder}
									queryParams={{}}
								/>
							</this.TaskCustomFieldRef1>
						}

						<this.TaskCustomField dictProps={Settings.fields.task.customField} id="customField"/>

						{plannedCompletion &&
							<this.PlannedCompletionField dictProps={plannedCompletion} id="plannedCompletion" addon={CALENDAR_ICON}>
								<DatePicker showTodayButton placeholder={plannedCompletion.placeholder} dateFormat="DD/MM/YYYY" showClearButton={false} />
							</this.PlannedCompletionField>
						}

						{projectedCompletion &&
							<this.ProjectedCompletionField dictProps={projectedCompletion} id="projectedCompletion" addon={CALENDAR_ICON}>
								<DatePicker showTodayButton placeholder={projectedCompletion.placeholder} dateFormat="DD/MM/YYYY" showClearButton={false} />
							</this.ProjectedCompletionField>
						}

						{customFieldEnum1 &&
							<this.TaskCustomFieldEnum1  dictProps={Object.without(customFieldEnum1, 'enum')} id="customFieldEnum1">
								<ButtonToggleGroup>
									{customEnumButtons(customFieldEnum1.enum)}
								</ButtonToggleGroup>
							</this.TaskCustomFieldEnum1>
						}

						{customFieldEnum2 &&
							<this.TaskCustomFieldEnum2  dictProps={Object.without(customFieldEnum2, 'enum')} id="customFieldEnum2">
								<ButtonToggleGroup>
									{customEnumButtons(customFieldEnum2.enum)}
								</ButtonToggleGroup>
							</this.TaskCustomFieldEnum2>
						}

						</Fieldset>
				</ValidatableForm>
			</div>
		)
	}

	@autobind
	onChange() {
		this.setState({
			isBlocking: this.formHasUnsavedChanges(this.props.task, this.props.original),
		})
	}

	@autobind
	onSubmit(event) {
		let {task, edit} = this.props
		task.responsibleOrg = utils.getReference(task.responsibleOrg)
		task.customFieldRef1 = utils.getReference(task.customFieldRef1)
		const operation = edit ? 'updateTask' : 'createTask'
		let graphql = operation + '(task: $task)'
		graphql += edit ? '' : ' { id }'
		const variables = { task: task }
		const variableDef = '($task: TaskInput!)'
		this.setState({isBlocking: false})
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (data[operation].id) {
					task.id = data[operation].id
				}
				this.props.history.replace(Task.pathForEdit(task))
				this.props.history.push({
					pathname: Task.pathFor(task),
					state: {
						success: 'Task saved',
					}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
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
