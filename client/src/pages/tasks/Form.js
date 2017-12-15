import React, {PropTypes} from 'react'
import autobind from 'autobind-decorator'

import {Button} from 'react-bootstrap'

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

export default class TaskForm extends ValidatableFormWrapper {
	static propTypes = {
		task: PropTypes.object.isRequired,
		edit: PropTypes.bool,
	}

	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		let {task, edit} = this.props
		let {currentUser} = this.context.app.state
		let taskShortTitle = dict.lookup('TASK_SHORT_NAME')

		let orgSearchQuery = {}
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

						<Form.Field id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value="ACTIVE">Active</Button>
								<Button id="statusInactiveButton" value="INACTIVE">Inactive</Button>
							</ButtonToggleGroup>
						</Form.Field>

						<Form.Field id="responsibleOrg" label="Responsible organization">
							<Autocomplete valueKey="shortName"
								placeholder={`Select a responsible organization for this ${taskShortTitle}`}
								url="/api/organizations/search"
								queryParams={orgSearchQuery}
							/>
						</Form.Field>
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
