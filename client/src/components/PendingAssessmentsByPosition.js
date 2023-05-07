import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _isEmpty from "lodash/isEmpty"
import { Position, Task } from "models"
import {
  getNotifications,
  GRAPHQL_NOTIFICATIONS_NOTE_FIELDS
} from "notificationsUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

const GQL_GET_POSITION_LIST = gql`
  query($positionQuery: PositionSearchQueryInput) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        positionRole
        status
        organization {
          uuid
          shortName
        }
        location {
          uuid
          name
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
        associatedPositions {
          uuid
          name
          code
          type
          positionRole
          status
          organization {
            uuid
            shortName
          }
          location {
            uuid
            name
          }
          person {
            uuid
            name
            rank
            avatar(size: 32)
            ${GRAPHQL_NOTIFICATIONS_NOTE_FIELDS}
          }
        }
        responsibleTasks(
          query: {
            status: ACTIVE
          }
        ) {
          uuid
          shortName
          longName
          parentTask {
            uuid
            shortName
          }
          ascendantTasks(query: { pageNum: 0, pageSize: 0 }) {
            uuid
            shortName
            parentTask {
              uuid
            }
          }
          ${GRAPHQL_NOTIFICATIONS_NOTE_FIELDS}
        }
      }
    }
  }
`

/*
 * Component displaying positions that currently have pending assessments.
 */
const PendingAssessmentsByPosition = ({
  pageDispatchers,
  queryParams,
  style
}) => {
  const [pageNum, setPageNum] = useState(0)
  const positionQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery
  })
  usePageTitle("Pending Assessments by Position")
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const {
    pageSize,
    pageNum: curPage,
    totalCount,
    list: positions
  } = data.positionList
  return (
    <div>
      <Fieldset id="pending" title="Positions with pending assessments">
        <AdvisorList
          positions={positions}
          pageSize={pageSize}
          pageNum={curPage}
          totalCount={totalCount}
          goToPage={setPageNum}
        />
      </Fieldset>
    </div>
  )
}

PendingAssessmentsByPosition.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  style: PropTypes.object
}

const AdvisorList = ({
  positions,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  if (_isEmpty(positions)) {
    return (
      <em>No {Settings.fields.advisor.person.name} with pending assessments</em>
    )
  }
  const borderStyle = { borderRight: "2px solid #ddd" }
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
        <Table striped hover responsive className="positions_table">
          <thead>
            <tr>
              <th colSpan="3" style={borderStyle}>
                {Settings.fields.advisor.person.name}
              </th>
              <th colSpan="3" style={borderStyle}>
                {Settings.fields.principal.person.name} to assess
              </th>
              <th colSpan="1">{Settings.fields.task.shortLabel} to assess</th>
            </tr>
            <tr>
              <th style={{ width: "20%" }}>Name</th>
              <th style={{ width: "10%" }}>Position</th>
              <th style={{ width: "10%", ...borderStyle }}>Organization</th>
              <th style={{ width: "20%" }}>Name</th>
              <th style={{ width: "10%" }}>Position</th>
              <th style={{ width: "10%", ...borderStyle }}>Organization</th>
              <th style={{ width: "20%" }}>Name</th>
            </tr>
          </thead>
          <tbody>
            {Position.map(positions, pos => {
              const nameComponents = []
              pos.name && nameComponents.push(pos.name)
              pos.code && nameComponents.push(pos.code)
              const notifications = getNotifications(pos)
              return (
                <tr key={pos.uuid}>
                  <td>
                    {pos.person && (
                      <LinkTo modelType="Person" model={pos.person} />
                    )}
                  </td>
                  <td>
                    <LinkTo modelType="Position" model={pos}>
                      {nameComponents.join(" - ")}
                    </LinkTo>
                  </td>
                  <td style={borderStyle}>
                    {pos.organization && (
                      <LinkTo
                        modelType="Organization"
                        model={pos.organization}
                      />
                    )}
                  </td>
                  <td colSpan="3" style={borderStyle}>
                    <PrincipalList
                      positions={
                        notifications.counterpartsWithPendingAssessments
                      }
                    />
                  </td>
                  <td colSpan="1">
                    <TaskList
                      tasks={notifications.tasksWithPendingAssessments}
                    />
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

AdvisorList.propTypes = {
  positions: PropTypes.array.isRequired,
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

const PrincipalList = ({ positions }) => {
  if (_isEmpty(positions)) {
    return <em>No {Settings.fields.principal.person.name} to assess</em>
  }
  return (
    <Table responsive style={{ background: "transparent" }}>
      <tbody>
        {Position.map(positions, pos => {
          const nameComponents = []
          pos.name && nameComponents.push(pos.name)
          pos.code && nameComponents.push(pos.code)
          return (
            <tr key={pos.uuid}>
              <td style={{ width: "50%" }}>
                {pos.person && <LinkTo modelType="Person" model={pos.person} />}
              </td>
              <td style={{ width: "25%" }}>
                <LinkTo modelType="Position" model={pos}>
                  {nameComponents.join(" - ")}
                </LinkTo>
              </td>
              <td style={{ width: "25%" }}>
                {pos.organization && (
                  <LinkTo modelType="Organization" model={pos.organization} />
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

PrincipalList.propTypes = {
  positions: PropTypes.array.isRequired
}

const TaskList = ({ tasks }) => {
  if (_isEmpty(tasks)) {
    return <em>No {Settings.fields.task.shortLabel} to assess</em>
  }
  return (
    <Table responsive style={{ background: "transparent" }}>
      <tbody>
        {Task.map(tasks, task => {
          return (
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
          )
        })}
      </tbody>
    </Table>
  )
}

TaskList.propTypes = {
  tasks: PropTypes.array.isRequired
}

export default PendingAssessmentsByPosition
