import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import moment from 'moment'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'

import TaskForm from './Form'

import API from 'api'
import Settings from 'Settings'
import {Task} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class TaskEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	state = {
		task: new Task(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			task(uuid:"${props.match.params.uuid}") {
				uuid, shortName, longName, status,
				customField, customFieldEnum1, customFieldEnum2,
				plannedCompletion, projectedCompletion,
				responsibleOrg { uuid, shortName, longName, identificationCode },
				customFieldRef1 { uuid, shortName, longName }
			}
		`).then(data => {
			const task = new Task(data.task)
			if (data.task.plannedCompletion) {
				task.plannedCompletion = moment(data.task.plannedCompletion).format()
			}
			if (data.task.projectedCompletion) {
				task.projectedCompletion = moment(data.task.projectedCompletion).format()
			}
			this.setState({task})
		})
	}

	render() {
		const { task } = this.state
		return (
			<div>
				<Breadcrumbs items={[[`${Settings.fields.task.shortLabel} ${task.shortName}`, Task.pathFor(task)], ["Edit", Task.pathForEdit(task)]]} />
				<TaskForm edit initialValues={task} title={`${Settings.fields.task.shortLabel} ${task.shortName}`} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(TaskEdit)
