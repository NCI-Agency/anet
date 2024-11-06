import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Task } from "models"
import pluralize from "pluralize"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_TASK_LIST = gql`
  query ($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
      }
    }
  }
`

interface TaskTableProps {
  // query variables for tasks, when query & pagination wanted:
  queryParams?: any
}

const TaskTable = (props: TaskTableProps) => {
  if (props.queryParams) {
    return <PaginatedTasks {...props} />
  }
  return <BaseTaskTable {...props} />
}

interface PaginatedTasksProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const PaginatedTasks = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}: PaginatedTasksProps) => {
  const [pageNum, setPageNum] = useState(0)
  const taskQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
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

interface BaseTaskTableProps {
  id?: string
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  // list of tasks:
  tasks: any[]
  // fill these when pagination wanted:
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
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
}: BaseTaskTableProps) => {
  const taskShortLabel = Settings.fields.task.shortLabel
  if (_get(tasks, "length", 0) === 0) {
    return <em>No {pluralize(taskShortLabel)} found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table striped hover responsive className="tasks_table" id={id}>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {Task.map(tasks, task => (
              <tr key={task.uuid}>
                <td>
                  <BreadcrumbTrail
                    modelType="Task"
                    leaf={task}
                    ascendantObjects={task.ascendantTasks}
                    parentField="parentTask"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TaskTable)
