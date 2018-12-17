import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import TaskForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import {Organization, Task} from 'models'
import Settings from 'Settings'

import utils from 'utils'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class TaskNew extends Page {

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
		const qs = utils.parseQueryString(props.location.search)
		if (qs.responsibleOrgUuid) {
			return API.query(/* GraphQL */`
				organization(uuid:"${qs.responsibleOrgUuid}") {
					uuid, shortName, longName, identificationCode, type
				}
			`).then(data => {
				const {task} = this.state
				task.responsibleOrg = new Organization(data.organization)
				this.setState({task})
			})
		}
	}

	render() {
		const { task } = this.state
		return (
			<div>
				<Breadcrumbs items={[[`New ${Settings.fields.task.shortLabel}`, Task.pathForNew()]]} />
				<TaskForm initialValues={task} title={`Create a new ${Settings.fields.task.shortLabel}`} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(TaskNew)
