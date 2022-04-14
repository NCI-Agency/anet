import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import PositionTable from "components/PositionTable"
import { Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
      longName
      status
      customField
      customFieldEnum1
      customFieldEnum2
      plannedCompletion
      projectedCompletion
      taskedOrganizations {
        uuid
        shortName
        longName
        identificationCode
      }
      customFieldRef1 {
        uuid
        shortName
        longName
      }
      responsiblePositions {
        uuid
        name
        code
        type
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
    subTasks: taskList(
      query: {
        pageSize: 0
        customFieldRef1Uuid: [$uuid]
        customFieldRef1Recursively: true
      }
    ) {
      list {
        uuid
        shortName
        longName
        customFieldRef1 {
          uuid
          shortName
        }
        customFields
      }
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

  data.subTasks && Model.populateEntitiesNotesCustomFields(data.subTasks.list)

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

        {Settings.fields.task.customFieldRef1 && (
          <PreviewField
            label={Settings.fields.task.customFieldRef1.label}
            value={
              task.customFieldRef1 && (
                <LinkTo modelType="Task" model={task.customFieldRef1}>
                  {task.customFieldRef1.shortName}{" "}
                  {task.customFieldRef1.longName}
                </LinkTo>
              )
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

        {Settings.fields.task.customFieldEnum1 && (
          <PreviewField
            label={Settings.fields.task.customFieldEnum1.label}
            value={task.customFieldEnum1}
          />
        )}

        {Settings.fields.task.customFieldEnum2 && (
          <PreviewField
            label={Settings.fields.task.customFieldEnum2.label}
            value={task.customFieldEnum2}
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
