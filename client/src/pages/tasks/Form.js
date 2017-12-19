import React, {PropTypes} from 'react'
import autobind from 'autobind-decorator'

import {Button} from 'react-bootstrap'
import DatePicker from 'react-bootstrap-date-picker'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import History from 'components/History'
import Messages from'components/Messages'
import ButtonToggleGroup from 'components/ButtonToggleGroup'

import dict from 'dictionary'
import API from 'api'
import {Task, Position} from 'models'

import CALENDAR_ICON from 'resources/calendar.png'

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

export default class TaskForm extends ValidatableFormWrapper {
	static propTypes = {
		task: PropTypes.object.isRequired,
		edit: PropTypes.bool,
	}

	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		const {task, edit} = this.props
		const {currentUser} = this.context.app.state
		const taskShortTitle = dict.lookup('TASK_SHORT_NAME')
		const taskProjectedCompletion = dict.lookup('TASK_PROJECTED_COMPLETION')
		const taskPlannedCompletion = dict.lookup('TASK_PLANNED_COMPLETION')
		const taskCustomField = dict.lookup('TASK_CUSTOM_FIELD')
		const taskCustomEnumLabel = dict.lookup('TASK_CUSTOM_ENUM_LABEL')
		const taskCustomEnumObj = dict.lookup('taskCustomEnum')
		const orgSearchQuery = {}
		orgSearchQuery.type = 'ADVISOR_ORG'
		if (currentUser && currentUser.position && currentUser.position.type === Position.TYPE.SUPER_USER) {
			orgSearchQuery.parentOrgId = currentUser.position.organization.id
			orgSearchQuery.parentOrgRecursively = true
		}
		const {ValidatableForm, RequiredField} = this
		return (
			<div>
				<Messages error={this.state.error} success={this.state.success} />

				<ValidatableForm
					formFor={task}
					onChange={this.onChange}
					onSubmit={this.onSubmit}
					submitText={`Save ${taskShortTitle}`}
					horizontal>

					<Fieldset title={edit ?
						`Edit ${taskShortTitle} ${task.shortName}`
						:
						`Create a new ${taskShortTitle}`
					}>
						<RequiredField id="shortName" label={`${taskShortTitle} number`} />
						<RequiredField id="longName" label={`${taskShortTitle} description`} />

						<RequiredField id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value="ACTIVE">Active</Button>
								<Button id="statusInactiveButton" value="INACTIVE">Inactive</Button>
							</ButtonToggleGroup>
						</RequiredField>

						<Form.Field id="responsibleOrg" label="Responsible organization">
							<Autocomplete valueKey="shortName"
								placeholder={`Select a responsible organization for this ${taskShortTitle}`}
								url="/api/organizations/search"
								queryParams={orgSearchQuery}
							/>
						</Form.Field>

						{taskCustomEnumObj && taskCustomEnumLabel &&
							<Form.Field id="customFieldEnum" label={taskCustomEnumLabel} >
								<ButtonToggleGroup>
									{customEnumButtons(taskCustomEnumObj)}
								</ButtonToggleGroup>
							</Form.Field>
						}

						{taskProjectedCompletion &&
							<Form.Field id="projectedCompletion" addon={CALENDAR_ICON} >
								<DatePicker showTodayButton placeholder={`${taskProjectedCompletion}`} dateFormat="DD/MM/YYYY" showClearButton={false} />
							</Form.Field>
						}

						{taskPlannedCompletion &&
							<Form.Field id="plannedCompletion" addon={CALENDAR_ICON} >
								<DatePicker showTodayButton placeholder={`${taskPlannedCompletion}`} dateFormat="DD/MM/YYYY" showClearButton={false} />
							</Form.Field>
						}

						{taskCustomField &&
							<Form.Field id="customField" label={`${taskCustomField}`} />
						}

					</Fieldset>
				</ValidatableForm>
			</div>
		)
	}

	@autobind
	onChange() {
		this.forceUpdate()
	}

	@autobind
	onSubmit(event) {
		let {task, edit} = this.props
		if (task.responsibleOrg && task.responsibleOrg.id) {
			task.responsibleOrg = {id: task.responsibleOrg.id}
		}
		let url = `/api/tasks/${edit ? 'update' : 'new'}`
		API.send(url, task, {disableSubmits: true})
			.then(response => {
				if (response.code) {
					throw response.code
				}

				if (response.id) {
					task.id = response.id
				}

				History.replace(Task.pathForEdit(task), false)
				History.push(Task.pathFor(task), {success: 'Saved successfully', skipPageLeaveWarning: true})
			}).catch(error => {
				this.setState({error: error})
				window.scrollTo(0, 0)
			})
	}
}
