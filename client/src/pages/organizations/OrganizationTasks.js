import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

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

const OrganizationTasks = ({
  pageDispatchers,
  queryParams,
  organization,
  linkToComp: LinkToComp
}) => {
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

  if (!organization.isAdvisorOrg()) {
    return <div />
  }

  const { pageSize, totalCount } = paginatedTasks

  if (_get(tasks, "length", 0) === 0) {
    return (
      <em>This organization doesn't have any {pluralize(taskShortLabel)}</em>
    )
  }

  return (
    <Fieldset
      id="tasks"
      title={pluralize(taskShortLabel)}
      action={
        isAdminUser && (
          <LinkToComp
            modelType="Task"
            model={Task.pathForNew({ taskedOrgUuid: organization.uuid })}
            button
          >
            Create {taskShortLabel}
          </LinkToComp>
        )
      }
    >
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPageNum}
      >
        <Table>
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
                  <LinkToComp modelType="Task" model={task}>
                    {task.shortName}
                  </LinkToComp>
                </td>
                <td>{task.longName}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </Fieldset>
  )
}

OrganizationTasks.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  organization: PropTypes.object.isRequired,
  queryParams: PropTypes.object,
  linkToComp: PropTypes.func.isRequired
}

export default connect(null, mapPageDispatchersToProps)(OrganizationTasks)
