import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Table} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import pluralize from 'pluralize'

import UltimatePagination from 'components/UltimatePagination'
import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import Settings from 'Settings'

import {Person, Task} from 'models'
import AppContext from 'components/AppContext'

class BaseOrganizationTasks extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
	}

	render() {
		const { currentUser } = this.props
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
			{tasks.length > 0 && this.pagination()}
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
		let {pageSize, pageNum, totalCount} = this.props.tasks
		let numPages = Math.ceil(totalCount / pageSize)
		if (numPages < 2 ) { return }
		return <header className="searchPagination">
			<UltimatePagination
				className="pull-right"
				currentPage={pageNum + 1}
				totalPages={numPages}
				boundaryPagesRange={1}
				siblingPagesRange={2}
				hideEllipsis={false}
				hidePreviousAndNextPageLinks={false}
				hideFirstAndLastPageLinks={true}
				onChange={(value) => this.props.goToPage(value - 1)}
			/>
		</header>
	}
}

const OrganizationTasks = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseOrganizationTasks currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default OrganizationTasks
