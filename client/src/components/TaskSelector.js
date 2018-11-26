import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import Settings from 'Settings'
import {Table, Button, HelpBlock} from 'react-bootstrap'

import { Task } from 'models'

import REMOVE_ICON from 'resources/delete.png'
import WARNING_ICON from 'resources/warning.png'

export default class TasksSelector extends Component {
	static propTypes = {
		tasks: PropTypes.array.isRequired,
		onChange: PropTypes.func.isRequired,
		onErrorChange: PropTypes.func,
		validationState: PropTypes.string,
		shortcuts: PropTypes.array,
		optional: PropTypes.bool,
	}

	render() {
		const {tasks, shortcuts, validationState, optional} = this.props

		const taskLongLabel = Settings.fields.task.longLabel
		const taskShortLabel = Settings.fields.task.shortLabel

		return <Fieldset title={taskLongLabel} action={optional && "(Optional)"} className="tasks-selector">
			<Form.Field id="tasks" label={taskShortLabel} validationState={validationState} >
				<Autocomplete
					objectType={Task}
					fields={Task.autocompleteQuery}
					queryParams={{status: Task.STATUS.ACTIVE}}
					placeholder={`Start typing to search for ${taskShortLabel}...`}
					template={Task.autocompleteTemplate}
					onChange={this.addTask}
					onErrorChange={this.props.onErrorChange}
					clearOnSelect={true} />

				{validationState && <HelpBlock>
					<img src={WARNING_ICON} alt="" height="20px" />
					{taskShortLabel} not found in Database
				</HelpBlock>}

				<Table hover striped>
					<thead>
						<tr>
							<th>Name</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{tasks.map((task, idx) =>
							<tr key={task.uuid}>
								<td>{task.shortName} - {task.longName}</td>
								<td onClick={this.removeTask.bind(this, task)} id={'taskDelete_' + idx}>
									<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove attendee" /></span>
								</td>
							</tr>
						)}
					</tbody>
				</Table>

				{tasks.length === 0 && <p style={{textAlign: 'center'}}><em>
					No {taskShortLabel} selected
					{this.props.optional && ' (this is fine if no ' + taskShortLabel + 's were discussed)'}
					.
				</em></p>}

				{ shortcuts && shortcuts.length > 0 && this.renderShortcuts() }
			</Form.Field>
		</Fieldset>
	}

	renderShortcuts() {
		const shortcuts = this.props.shortcuts || []
		const taskShortLabel = Settings.fields.task.shortLabel
		return <Form.Field.ExtraCol className="shortcut-list">
			<h5>Recent {taskShortLabel}</h5>
			{shortcuts.map(task =>
				<Button key={task.uuid} bsStyle="link" onClick={this.addTask.bind(this, task)}>Add "{task.shortName} {task.longName.substr(0,80)}{task.longName.length > 80 ? '...' : ''}"</Button>
			)}
		</Form.Field.ExtraCol>
	}

	@autobind
	addTask(newTask) {
		if (!newTask || !newTask.uuid) {
			return
		}

		let tasks = this.props.tasks

		if (!tasks.find(task => task.uuid === newTask.uuid)) {
			tasks.push(newTask)
		}

		this.props.onChange()
	}

	@autobind
	removeTask(oldTask) {
		let tasks = this.props.tasks
		let index = tasks.findIndex(task => task.uuid === oldTask.uuid)

		if (index !== -1) {
			tasks.splice(index, 1)
			this.props.onChange()
		}
	}
}
