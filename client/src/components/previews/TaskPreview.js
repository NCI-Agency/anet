import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import PositionTable from "components/PositionTable"
import RichTextEditor from "components/RichTextEditor"
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
      description
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
      ascendantTasks {
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
          longName
          identificationCode
        }
        person {
          uuid
          name
          rank
          role
          avatarUuid
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
            avatarUuid
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
            avatarUuid
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
        <h4 className="ellipsized-text">{`${fieldSettings.shortLabel} ${task.shortName}`}</h4>
      </div>
      <div className="preview-section">
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={fieldSettings.longName}
          value={task.longName}
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.task.taskedOrganizations}
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
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.task.parentTask}
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
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.task.childrenTasks}
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
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.task.plannedCompletion}
            value={
              task.plannedCompletion &&
              moment(task.plannedCompletion).format(
                Settings.dateFormats.forms.displayShort.date
              )
            }
          />
        )}

        {Settings.fields.task.projectedCompletion && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.task.projectedCompletion}
            value={
              task.projectedCompletion &&
              moment(task.projectedCompletion).format(
                Settings.dateFormats.forms.displayShort.date
              )
            }
          />
        )}

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.task.status}
          value={Task.humanNameOfStatus(task.status)}
        />

        {task.description && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.task.description}
            value={<RichTextEditor readOnly value={task.description} />}
          />
        )}
      </div>

      <h4>{Settings.fields.task.responsiblePositions?.label}</h4>
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
