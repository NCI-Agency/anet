import API from "api"
import { gql } from "apollo-boost"
import LinkToPreviewed from "components/LinkToPreviewed"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Task } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
      }
    }
  }
`

const TaskTable = props => {
  if (props.queryParams) {
    return <PaginatedTasks {...props} />
  }
  return <BaseTaskTable {...props} />
}

TaskTable.propTypes = {
  // query variables for tasks, when query & pagination wanted:
  queryParams: PropTypes.object
}

const PaginatedTasks = ({ queryParams, pageDispatchers, ...otherProps }) => {
  const [pageNum, setPageNum] = useState(0)
  const taskQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery: taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const { pageSize, pageNum: curPage, totalCount, list: tasks } = data.taskList

  return (
    <BaseTaskTable
      tasks={tasks}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

PaginatedTasks.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object
}

const BaseTaskTable = ({
  id,
  showDelete,
  onDelete,
  tasks,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  if (_get(tasks, "length", 0) === 0) {
    return <em>No tasks found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table
          striped
          condensed
          hover
          responsive
          className="tasks_table"
          id={id}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Task.map(tasks, task => {
              return (
                <tr key={task.uuid}>
                  <td>
                    <LinkToPreviewed
                      modelType="Task"
                      model={task}
                      previewId="task-table-task"
                    >
                      {task.shortName} {task.longName}
                    </LinkToPreviewed>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

BaseTaskTable.propTypes = {
  id: PropTypes.string,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  // list of tasks:
  tasks: PropTypes.array.isRequired,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(TaskTable)
