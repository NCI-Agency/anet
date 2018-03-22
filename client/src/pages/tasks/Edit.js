import React from 'react'
import Page from 'components/Page'
import moment from 'moment'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'

import TaskForm from './Form'

import API from 'api'
import Settings from 'Settings'
import {Task} from 'models'

export default class TaskEdit extends Page {
	static pageProps = {
		useNavigation: false
	}


	static modelName = 'Task'

	constructor(props) {
		super(props)

		this.state = {
			task: new Task(),
			originalTask: new Task()
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			task(id:${props.match.params.id}) {
				id, shortName, longName, status,
				customField, customFieldEnum1, customFieldEnum2,
				plannedCompletion, projectedCompletion,
				responsibleOrg {id,shortName, longName, identificationCode},
				customFieldRef1 { id, shortName, longName }
			}
		`).then(data => {
			if (data.task.plannedCompletion) {
				data.task.plannedCompletion = moment(data.task.plannedCompletion).format()
			}
			if (data.task.projectedCompletion) {
				data.task.projectedCompletion = moment(data.task.projectedCompletion).format()
			}
			this.setState({task: new Task(data.task), originalTask: new Task(data.task)})
		})
	}

	render() {
		let task = this.state.task

		return (
			<div>
				<Breadcrumbs items={[[`${Settings.fields.task.shortLabel} ${task.shortName}`, Task.pathFor(task)], ["Edit", Task.pathForEdit(task)]]} />

				<Messages error={this.state.error} success={this.state.success} />

				<NavigationWarning original={this.state.originalTask} current={task} />
				<TaskForm task={task} edit />
			</div>
		)
	}
}
