import React from 'react'
import Page from 'components/Page'

import TaskForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'

import API from 'api'
import dict from 'dictionary'
import {Task,Organization} from 'models'

export default class TaskNew extends Page {
	static pageProps = {
		useNavigation: false
	}


	constructor(props) {
		super(props)

		this.state = {
			task: new Task(),
			originalTask: new Task()
		}
	}

	fetchData(props) {
		if (props.location.query.responsibleOrgId) {
			API.query(/* GraphQL */`
				organization(id: ${props.location.query.responsibleOrgId}) {
					id, shortName, longName, identificationCode, type
				}
			`).then(data => {
				let task = this.state.task
				task.responsibleOrg = new Organization(data.organization)
				this.state.originalTask.responsibleOrg = new Organization(data.organization)
				this.setState({task})
			})
		}
	}

	render() {
		let task = this.state.task

		return (
			<div>
				<Breadcrumbs items={[['Create new ' + dict.lookup('POAM_SHORT_NAME'), Task.pathForNew()]]} />

				<NavigationWarning original={this.state.originalTask} current={task} />
				<TaskForm task={task} />
			</div>
		)
	}
}
