import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import { Task } from "models"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

interface NoPaginationTaskTableProps {
  id?: string
  tasks?: any[]
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  showOrganization?: boolean
  showDescription?: boolean
  noTasksMessage?: string
}

const NoPaginationTaskTable = ({
  id,
  tasks,
  showOrganization = false,
  showDelete = false,
  showDescription,
  onDelete,
  noTasksMessage = `No ${Settings.fields.task.shortLabel} found`
}: NoPaginationTaskTableProps) => {
  const tasksExist = _get(tasks, "length", 0) > 0

  return (
    <div id={id}>
      {tasksExist ? (
        <Table striped hover responsive className="tasks_table">
          <thead>
            <tr>
              <th>Name</th>
              {showOrganization && <th>Tasked organizations</th>}
              {showDescription && <th>Description</th>}
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {Task.map(tasks, task => {
              return (
                <tr key={task.uuid}>
                  <td className="taskName">
                    <BreadcrumbTrail
                      modelType="Task"
                      leaf={task}
                      ascendantObjects={task.ascendantTasks}
                      parentField="parentTask"
                    />
                  </td>
                  {showOrganization && (
                    <td className="taskOrg">
                      {task.taskedOrganizations.map(org => (
                        <LinkTo
                          modelType="Organization"
                          model={org}
                          key={`${task.uuid}-${org.uuid}`}
                        />
                      ))}
                    </td>
                  )}
                  {showDescription && (
                    <td className="taskLongName">
                      <span>{task.longName}</span>
                    </td>
                  )}
                  {showDelete && (
                    <td id={"taskDelete_" + task.uuid}>
                      <RemoveButton
                        title={`Remove ${Settings.fields.task.shortLabel}`}
                        onClick={() => onDelete(task)}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <em>{noTasksMessage}</em>
      )}
    </div>
  )
}

export default NoPaginationTaskTable
