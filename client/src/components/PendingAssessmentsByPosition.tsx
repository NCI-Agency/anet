import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
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
  GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS
} from "notificationsUtils"
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
        role
        status
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        associatedPositions {
          uuid
          name
          code
          type
          role
          status
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS}
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
          ascendantTasks {
            uuid
            shortName
            parentTask {
              uuid
            }
          }
          ${GRAPHQL_NOTIFICATIONS_ASSESSMENT_FIELDS}
        }
      }
    }
  }
`

interface PendingAssessmentsByPositionProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  style?: any
}

/*
 * Component displaying positions that currently have pending assessments.
 */
const PendingAssessmentsByPosition = ({
  pageDispatchers,
  queryParams,
  style // eslint-disable-line @typescript-eslint/no-unused-vars
}: PendingAssessmentsByPositionProps) => {
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
        <PositionList
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

interface PositionListProps {
  positions: any[]
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
}

const PositionList = ({
  positions,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}: PositionListProps) => {
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
              <th colSpan={3} style={borderStyle}>
                {Settings.fields.advisor.person.name}
              </th>
              <th colSpan={3} style={borderStyle}>
                {Settings.fields.regular.person.name} to assess
              </th>
              <th colSpan={1}>{Settings.fields.task.shortLabel} to assess</th>
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
              if (pos.name) {
                nameComponents.push(pos.name)
              }
              if (pos.code) {
                nameComponents.push(pos.code)
              }
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
                  <td colSpan={3} style={borderStyle}>
                    <InterlocutorList
                      positions={
                        notifications.counterpartsWithPendingAssessments
                      }
                    />
                  </td>
                  <td colSpan={1}>
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

interface InterlocutorListProps {
  positions: any[]
}

const InterlocutorList = ({ positions }: InterlocutorListProps) => {
  if (_isEmpty(positions)) {
    return <em>No {Settings.fields.regular.person.name} to assess</em>
  }
  return (
    <Table responsive style={{ background: "transparent" }}>
      <tbody>
        {Position.map(positions, pos => {
          const nameComponents = []
          if (pos.name) {
            nameComponents.push(pos.name)
          }
          if (pos.code) {
            nameComponents.push(pos.code)
          }
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

interface TaskListProps {
  tasks: any[]
}

const TaskList = ({ tasks }: TaskListProps) => {
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

export default PendingAssessmentsByPosition
