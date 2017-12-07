import React, {Component, PropTypes} from 'react'
import {Table, Pagination} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import dict from 'dictionary'

import {Task} from 'models'

export default class OrganizationTasks extends Component {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		let currentUser = this.context.app.state.currentUser

		let org = this.props.organization
		if (!org.isAdvisorOrg()) {
			return <div></div>
		}

		let tasks = this.props.tasks.list || []
		let isAdminUser = currentUser && currentUser.isAdmin()
		let taskShortName = dict.lookup('task_SHORT_NAME')

		return <Fieldset id="tasks" title={taskShortName} action={
			isAdminUser && <LinkTo task={Task.pathForNew({responsibleOrgId: org.id})} button>Create {taskShortName}</LinkTo>
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
						<tr key={task.id} id={`task_${idx}`} >
							<td><LinkTo task={task} >{task.shortName}</LinkTo></td>
							<td>{task.longName}</td>
						</tr>
					)}
				</tbody>
			</Table>

			{tasks.length === 0 && <em>This organization doesn't have any {taskShortName}s</em>}
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
