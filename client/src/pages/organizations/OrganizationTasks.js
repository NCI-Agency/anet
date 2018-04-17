import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Table, Pagination} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'

import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import Settings from 'Settings'

import {Task} from 'models'

export default class OrganizationTasks extends Component {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		const currentUser = this.context.app.state.currentUser
		const org = this.props.organization

		if (!org.isAdvisorOrg()) {
			return <div></div>
		}

		const tasks = this.props.tasks.list || []
		const isAdminUser = currentUser && currentUser.isAdmin()
		const taskShortLabel = Settings.fields.task.shortLabel

		return <Fieldset id="tasks" title={pluralize(taskShortLabel)} action={
			isAdminUser && <LinkTo task={Task.pathForNew({responsibleOrgUuid: org.uuid})} button>Create {taskShortLabel}</LinkTo>
		}>
			{this.pagination()}
			<Table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
					</tr>
				</thead>

				<tbody>
					{Task.map(tasks, (task, idx) =>
						<tr key={task.uuid} id={`task_${idx}`} >
							<td><LinkTo task={task} >{task.shortName}</LinkTo></td>
							<td>{task.longName}</td>
						</tr>
					)}
				</tbody>
			</Table>

			{tasks.length === 0 && <em>This organization doesn't have any {pluralize(taskShortLabel)}</em>}
		</Fieldset>
	}

	@autobind
	pagination() {
		let goToPage = this.props.goToPage
		let {pageSize, pageNum, totalCount} = this.props.tasks
		let numPages = Math.ceil(totalCount / pageSize)
		if (numPages < 2 ) { return }
		return <header className="searchPagination" ><Pagination
			className="pull-right"
			prev
			next
			items={numPages}
			ellipsis
			maxButtons={6}
			activePage={pageNum + 1}
			onSelect={(value) => goToPage(value - 1)}
		/></header>
	}
}
