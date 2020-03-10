import { Settings } from "api"
import LinkTo from "components/LinkTo"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"

const TaskTable = ({
  id,
  tasks,
  showParent,
  showOrganization,
  showDelete,
  showDescription,
  onDelete,
  noTasksMessage
}) => {
  const tasksExist = _get(tasks, "length", 0) > 0

  return (
    <div id={id}>
      {tasksExist ? (
        <Table striped condensed hover responsive className="tasks_table">
          <thead>
            <tr>
              <th>Name</th>
              {showParent && (
                <th>{Settings.fields.task.topLevel.shortLabel}</th>
              )}
              {showOrganization && <th>Tasked organizations</th>}
              {showDescription && <th>Description</th>}
              <th />
            </tr>
          </thead>
          <tbody>
            {Task.map(tasks, task => {
              const isTopLevelTask = _isEmpty(task.customFieldRef1)
              const fieldSettings = isTopLevelTask
                ? Settings.fields.task.topLevel
                : Settings.fields.task.subLevel
              return (
                <tr key={task.uuid}>
                  <td className="taskName">
                    <LinkTo modelType="Task" model={task}>
                      {task.shortName}
                    </LinkTo>
                  </td>
                  {showParent && (
                    <td className="parentTaskName">
                      {task.customFieldRef1 && (
                        <LinkTo modelType="Task" model={task.customFieldRef1}>
                          {task.customFieldRef1.shortName}
                        </LinkTo>
                      )}
                    </td>
                  )}
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
                    <td
                      onClick={() => onDelete(task)}
                      id={"taskDelete_" + task.uuid}
                    >
                      <span style={{ cursor: "pointer" }}>
                        <img
                          src={REMOVE_ICON}
                          height={14}
                          alt={`Remove ${fieldSettings.shortLabel}`}
                        />
                      </span>
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

TaskTable.propTypes = {
  id: PropTypes.string,
  tasks: PropTypes.array,
  showParent: PropTypes.bool,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  showOrganization: PropTypes.bool,
  showDescription: PropTypes.bool,
  noTasksMessage: PropTypes.string
}

TaskTable.defaultProps = {
  showDelete: false,
  showOrganization: false,
  noTasksMessage: `No ${Settings.fields.task.shortLabel} found`
}

export default TaskTable
