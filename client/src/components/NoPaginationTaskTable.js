import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import { Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

const NoPaginationTaskTable = ({
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
              const fieldSettings = task.fieldSettings()
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
                    <td id={"taskDelete_" + task.uuid}>
                      <RemoveButton
                        title={`Remove ${fieldSettings.shortLabel}`}
                        altText={`Remove ${fieldSettings.shortLabel}`}
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

NoPaginationTaskTable.propTypes = {
  id: PropTypes.string,
  tasks: PropTypes.array,
  showParent: PropTypes.bool,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  showOrganization: PropTypes.bool,
  showDescription: PropTypes.bool,
  noTasksMessage: PropTypes.string
}

NoPaginationTaskTable.defaultProps = {
  showDelete: false,
  showOrganization: false,
  noTasksMessage: `No ${Settings.fields.task.shortLabel} found`
}

export default NoPaginationTaskTable
