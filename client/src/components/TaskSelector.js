import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import dict from 'dictionary'
import {Table, Button, HelpBlock} from 'react-bootstrap'

import {Task} from 'models'

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

	static contextTypes = {
		app: PropTypes.object.isRequired
	}

	render() {
		let {tasks, shortcuts, validationState, optional} = this.props

		let taskLong = dict.lookup('POAM_LONG_NAME')
		let taskShort = dict.lookup("POAM_SHORT_NAME")

		return <Fieldset title={taskLong} action={optional && "(Optional)"} className="tasks-selector">
			<Form.Field id="tasks" label={taskShort} validationState={validationState} >
				<Autocomplete
					objectType={Task}
					fields={Task.autocompleteQuery}
					queryParams={{status: 'ACTIVE'}}
					placeholder={`Start typing to search for ${taskShort}...`}
					template={Task.autocompleteTemplate}
					onChange={this.addTask}
					onErrorChange={this.props.onErrorChange}
					clearOnSelect={true} />

				{validationState && <HelpBlock>
					<img src={WARNING_ICON} role="presentation" height="20px" />
					{taskShort} not found in Database
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
							<tr key={task.id}>
								<td>{task.shortName} - {task.longName}</td>
								<td onClick={this.removeTask.bind(this, task)} id={'taskDelete_' + idx}>
									<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove attendee" /></span>
								</td>
							</tr>
						)}
					</tbody>
				</Table>

				{tasks.length === 0 && <p style={{textAlign: 'center'}}><em>
					No {taskShort} selected
					{this.props.optional && ' (this is fine if no ' + taskShort + 's were discussed)'}
					.
				</em></p>}

				{ shortcuts && shortcuts.length > 0 && this.renderShortcuts() }
			</Form.Field>
		</Fieldset>
	}

	renderShortcuts() {
		let shortcuts = this.props.shortcuts || []
		let taskShortName = dict.lookup("POAM_SHORT_NAME")
		return <Form.Field.ExtraCol className="shortcut-list">
			<h5>Recent {taskShortName}</h5>
			{shortcuts.map(task =>
				<Button key={task.id} bsStyle="link" onClick={this.addTask.bind(this, task)}>Add "{task.shortName} {task.longName.substr(0,80)}{task.longName.length > 80 ? '...' : ''}"</Button>
			)}
		</Form.Field.ExtraCol>
	}

	@autobind
	addTask(newTask) {
		if (!newTask || !newTask.id) {
			return
		}

		let tasks = this.props.tasks

		if (!tasks.find(task => task.id === newTask.id)) {
			tasks.push(newTask)
		}

		this.props.onChange()
	}

	@autobind
	removeTask(oldTask) {
		let tasks = this.props.tasks
		let index = tasks.findIndex(task => task.id === oldTask.id)

		if (index !== -1) {
			tasks.splice(index, 1)
			this.props.onChange()
		}
	}
}
