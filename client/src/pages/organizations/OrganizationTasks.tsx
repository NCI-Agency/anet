import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Task } from "models"
import pluralize from "pluralize"
import React, { useContext, useState } from "react"
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

interface OrganizationTasksProps {
  pageDispatchers?: PageDispatchersPropType
  organization: any
  queryParams?: any
}

const OrganizationTasks = ({
  pageDispatchers,
  queryParams,
  organization
}: OrganizationTasksProps) => {
  const { currentUser } = useContext(AppContext)
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

  const paginatedTasks = data.taskList
  const tasks = paginatedTasks ? paginatedTasks.list : []
  const isAdminUser = currentUser && currentUser.isAdmin()
  const taskShortLabel = Settings.fields.task.shortLabel
  const { pageSize, totalCount } = paginatedTasks

  return (
    <Fieldset
      id="tasks"
      title={pluralize(taskShortLabel)}
      action={
        isAdminUser && (
          <LinkTo
            modelType="Task"
            model={Task.pathForNew({ taskedOrgUuid: organization.uuid })}
            button
          >
            Create {taskShortLabel}
          </LinkTo>
        )
      }
    >
      {(_get(tasks, "length", 0) === 0 && (
        <em>This organization doesn't have any {pluralize(taskShortLabel)}</em>
      )) || (
        <UltimatePaginationTopDown
          componentClassName="searchPagination"
          className="float-end"
          pageNum={pageNum}
          pageSize={pageSize}
          totalCount={totalCount}
          goToPage={setPageNum}
        >
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {Task.map(tasks, (task, idx) => (
                <tr key={task.uuid} id={`task_${idx}`}>
                  <td>
                    <BreadcrumbTrail
                      modelType="Task"
                      leaf={task}
                      ascendantObjects={task.ascendantTasks}
                      parentField="parentTask"
                    />
                  </td>
                  <td>{task.longName}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </UltimatePaginationTopDown>
      )}
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(OrganizationTasks)
