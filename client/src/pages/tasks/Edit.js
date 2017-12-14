import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'

import TaskForm from './Form'

import API from 'api'
import dict from 'dictionary'
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
			task(id:${props.params.id}) {
				id, shortName, longName, status,
				responsibleOrg {id,shortName, longName, identificationCode}
			}
		`).then(data => {
			this.setState({task: new Task(data.task), originalTask: new Task(data.task)})
		})
	}

	render() {
		let task = this.state.task

		return (
			<div>
				<Breadcrumbs items={[[`${dict.lookup('TASK_SHORT_NAME')} ${task.shortName}`, Task.pathFor(task)], ["Edit", Task.pathForEdit(task)]]} />

				<Messages error={this.state.error} success={this.state.success} />

				<NavigationWarning original={this.state.originalTask} current={task} />
				<TaskForm task={task} edit />
			</div>
		)
	}
}
