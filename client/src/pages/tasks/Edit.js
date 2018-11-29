import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

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
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			this.setState({task: new Task(data.task)})
		})
	}

	render() {
		const { task } = this.state
		return (
			<div>
				<RelatedObjectNotes notes={task.notes} relatedObject={task.uuid && {relatedObjectType: 'tasks', relatedObjectUuid: task.uuid}} />
				<Breadcrumbs items={[[`${Settings.fields.task.shortLabel} ${task.shortName}`, Task.pathFor(task)], ["Edit", Task.pathForEdit(task)]]} />
				<TaskForm edit initialValues={task} title={`${Settings.fields.task.shortLabel} ${task.shortName}`} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(TaskEdit)
