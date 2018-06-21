import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import TaskForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import Settings from 'Settings'
import {Organization, Person, Task} from 'models'

import utils from 'utils'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class TaskNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			task: new Task(),
			originalTask: new Task()
		}
	}

	fetchData(props) {
		const qs = utils.parseQueryString(props.location.search)
		if (qs.responsibleOrgUuid) {
			return API.query(/* GraphQL */`
				organization(uuid:"${qs.responsibleOrgUuid}") {
					uuid, shortName, longName, identificationCode, type
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

export default connect(null, mapDispatchToProps)(TaskNew)
