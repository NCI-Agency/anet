import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Table} from 'react-bootstrap'

import UltimatePagination from 'components/UltimatePagination'
import LinkTo from 'components/LinkTo'
import {Task} from 'models'
import {Settings} from 'api'

import _get from 'lodash/get'
import pluralize from 'pluralize'

import REMOVE_ICON from 'resources/delete.png'

export default class TaskTable extends Component {
	static propTypes = {
		tasks: PropTypes.array, // list of tasks, when no pagination wanted
		showDelete: PropTypes.bool,
		onDelete: PropTypes.func,
		paginatedTasks: PropTypes.shape({
			totalCount: PropTypes.number,
			pageNum: PropTypes.number,
			pageSize: PropTypes.number,
			list: PropTypes.array.isRequired,
		}),
		goToPage: PropTypes.func,
		optional: PropTypes.bool,
	}

	render() {
		let tasks
		let numPages = 0
		if (this.props.paginatedTasks) {
			var {pageSize, pageNum, totalCount} = this.props.paginatedTasks
			numPages = (pageSize <= 0) ? 1 : Math.ceil(totalCount / pageSize)
			tasks = this.props.paginatedTasks.list
			pageNum++
		} else {
			tasks = this.props.tasks
		}

		let tasksExist = _get(tasks, 'length', 0) > 0
		return <div>
			{tasksExist ?
				<div>
					{numPages > 1 &&
						<header className="searchPagination">
							<UltimatePagination
								className="pull-right"
								currentPage={pageNum}
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

					<Table striped condensed hover responsive className="tasks_table">
						<thead>
							<tr>
								<th>Name</th>
								{this.props.showOrganization && <th>Organization</th>}
								<th />
							</tr>
						</thead>
						<tbody>
							{Task.map(tasks, task =>
								<tr key={task.uuid}>
									<td className="taskName" ><LinkTo task={task} >{task.shortName} - {task.longName}</LinkTo></td>
									{this.props.showOrganization && <td className="taskOrg" ><LinkTo organization={task.responsibleOrg} /></td>}
									{this.props.showDelete && <td onClick={this.props.onDelete.bind(this, task)} id={'taskDelete_' + task.uuid} >
										<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt={`Remove ${Settings.fields.task.shortLabel}`} /></span>
									</td>}
								</tr>
							)}
						</tbody>
					</Table>

					{tasks.length === 0 && <p style={{textAlign: 'center'}}><em>
						No {Settings.fields.task.shortLabel} selected
						{this.props.optional && ` (this is fine if no ${pluralize(Settings.fields.task.shortLabel)} were discussed)`}
						.
					</em></p>}
				</div>
			:
				<em>No tasks found</em>
		}
		</div>
	}
}
