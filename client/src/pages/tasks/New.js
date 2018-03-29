import React from 'react'
import Page from 'components/Page'

import TaskForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import Settings from 'Settings'
import {Task,Organization} from 'models'

import utils from 'utils'

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
		const qs = utils.parseQueryString(props.location.search)
		if (qs.responsibleOrgId) {
			API.query(/* GraphQL */`
				organization(id: ${qs.responsibleOrgId}) {
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
				<Breadcrumbs items={[['Create new ' + Settings.fields.task.shortLabel, Task.pathForNew()]]} />

				<TaskForm original={this.state.originalTask} task={task} />
			</div>
		)
	}
}
