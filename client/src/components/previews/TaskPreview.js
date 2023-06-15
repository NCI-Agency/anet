import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import PositionTable from "components/PositionTable"
import { Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
      longName
      status
      plannedCompletion
      projectedCompletion
      taskedOrganizations {
        uuid
        shortName
        longName
        identificationCode
      }
      parentTask {
        uuid
        shortName
        parentTask {
          uuid
        }
      }
      ascendantTasks(query: { pageNum: 0, pageSize: 0 }) {
        uuid
        shortName
        parentTask {
          uuid
        }
      }
      childrenTasks {
        uuid
        shortName
      }
      responsiblePositions {
        uuid
        name
        code
        type
        role
        status
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      planningApprovalSteps {
        uuid
        name
        restrictedApproval
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      approvalSteps {
        uuid
        name
        restrictedApproval
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      customFields
    }
  }
`

const TaskPreview = ({ className, uuid }) => {
  const { data, error } = API.useApiQuery(GQL_GET_TASK, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  if (data.task) {
    Model.populateCustomFields(data.task)
  }
  const task = new Task(data.task ? data.task : {})

  const fieldSettings = task.fieldSettings()
  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4>{`${fieldSettings.shortLabel} ${task.shortName}`}</h4>
      </div>
      <div className="preview-section">
        <PreviewField
          label={fieldSettings.shortName.label}
          value={task.shortName}
        />
        <PreviewField
          label={fieldSettings.longName.label}
          value={task.longName}
        />
        <PreviewField
          label="Status"
          value={Task.humanNameOfStatus(task.status)}
        />
        <PreviewField
          label={Settings.fields.task.taskedOrganizations.label}
          value={
            task.taskedOrganizations && (
              <>
                {task.taskedOrganizations.map(org => (
                  <LinkTo
                    modelType="Organization"
                    model={org}
                    key={`${org.uuid}`}
                  />
                ))}
              </>
            )
          }
        />

        {Settings.fields.task.parentTask && task.parentTask?.uuid && (
          <PreviewField
            label={Settings.fields.task.parentTask.label}
            value={
              task.parentTask && (
                <BreadcrumbTrail
                  modelType="Task"
                  leaf={task.parentTask}
                  ascendantObjects={task.ascendantTasks}
                  parentField="parentTask"
                />
              )
            }
          />
        )}

        {Settings.fields.task.childrenTasks &&
          task.childrenTasks?.length > 0 && (
            <PreviewField
              label={Settings.fields.task.childrenTasks}
              name="subEfforts"
              value={
                <ListGroup>
                  {task.childrenTasks?.map(task => (
                    <ListGroupItem key={task.uuid}>
                      <LinkTo showIcon={false} modelType="Task" model={task} />
                    </ListGroupItem>
                  ))}
                </ListGroup>
              }
            />
        )}

        {Settings.fields.task.plannedCompletion && (
          <PreviewField
            label={Settings.fields.task.plannedCompletion.label}
            value={
              task.plannedCompletion &&
              moment(task.plannedCompletion).format(
                Settings.dateFormats.forms.displayShort.date
              )
            }
          />
        )}
      </div>

      <h4>Responsible positions</h4>
      <div className="preview-section">
        <PositionTable positions={task.responsiblePositions} />
      </div>
    </div>
  )
}

TaskPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default TaskPreview
