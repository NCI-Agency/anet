import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import { Person, Task } from "models"
import pluralize from "pluralize"
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

const BaseOrganizationTasks = props => {
  const { queryParams } = props
  const [pageNum, setPageNum] = useState(0)
  const taskQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const paginatedTasks = data.taskList
  const tasks = paginatedTasks ? paginatedTasks.list : []
  const { currentUser, organization } = props
  const isAdminUser = currentUser && currentUser.isAdmin()
  const taskShortLabel = Settings.fields.task.shortLabel

  if (!organization.isAdvisorOrg()) {
    return <div />
  }

  return (
    <Fieldset
      id="tasks"
      title={pluralize(taskShortLabel)}
      action={
        isAdminUser && (
          <LinkTo
            task={Task.pathForNew({ responsibleOrgUuid: organization.uuid })}
            button
          >
            Create {taskShortLabel}
          </LinkTo>
        )
      }
    >
      {pagination()}
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
                <LinkTo task={task}>{task.shortName}</LinkTo>
              </td>
              <td>{task.longName}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {tasks.length === 0 && (
        <em>This organization doesn't have any {pluralize(taskShortLabel)}</em>
      )}
    </Fieldset>
  )

  function pagination() {
    let { pageSize, pageNum, totalCount } = paginatedTasks
    let numPages = Math.ceil(totalCount / pageSize)
    if (numPages < 2) {
      return
    }
    return (
      <header className="searchPagination">
        <UltimatePagination
          className="pull-right"
          currentPage={pageNum + 1}
          totalPages={numPages}
          boundaryPagesRange={1}
          siblingPagesRange={2}
          hideEllipsis={false}
          hidePreviousAndNextPageLinks={false}
          hideFirstAndLastPageLinks
          onChange={value => setPageNum(value - 1)}
        />
      </header>
    )
  }
}

BaseOrganizationTasks.propTypes = {
  currentUser: PropTypes.instanceOf(Person),
  organization: PropTypes.object.isRequired,
  queryParams: PropTypes.object
}

const OrganizationTasks = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOrganizationTasks currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(OrganizationTasks)
