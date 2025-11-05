import {
  gqlAllTaskFields,
  gqlApprovalStepFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import PositionTable from "components/PositionTable"
import { PreviewTitle } from "components/previews/PreviewTitle"
import RichTextEditor from "components/RichTextEditor"
import { Task } from "models"
import moment from "moment"
import React from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      ${gqlAllTaskFields}
      taskedOrganizations {
        ${gqlEntityFieldsMap.Organization}
      }
      parentTask {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
      }
      ascendantTasks {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
      }
      childrenTasks {
        ${gqlEntityFieldsMap.Task}
      }
      responsiblePositions {
        ${gqlEntityFieldsMap.Position}
        location {
          ${gqlEntityFieldsMap.Location}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      planningApprovalSteps {
        ${gqlApprovalStepFields}
      }
      approvalSteps {
        ${gqlApprovalStepFields}
      }
    }
  }
`

interface TaskPreviewProps {
  className?: string
  uuid?: string
}

const TaskPreview = ({ className, uuid }: TaskPreviewProps) => {
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

  return (
    <div className={`${className} preview-content-scroll`}>
      <PreviewTitle
        title={`${Settings.fields.task.shortLabel} ${task.shortName}`}
        status={task.status}
      />
      <div className="preview-section">
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.task.longName}
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

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.task.selectable}
          value={utils.formatBoolean(task.selectable)}
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
        <PositionTable positions={task.responsiblePositions} showLocation />
      </div>
    </div>
  )
}

export default TaskPreview
