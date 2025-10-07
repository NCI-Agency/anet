import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Task } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import TaskForm from "./Form"

const GQL_GET_TASK = gql`
  query($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      updatedAt
      shortName
      longName
      selectable
      description
      status
      plannedCompletion
      projectedCompletion
      taskedOrganizations {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
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
      descendantTasks {
        uuid
        status
        shortName
        longName
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
        parentTask {
          uuid
        }
      }
      responsiblePositions {
        uuid
        name
        code
        type
        role
        status
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

interface TaskEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const TaskEdit = ({ pageDispatchers }: TaskEditProps) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Task",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.task?.shortName && `Edit | ${data.task.shortName}`)
  if (done) {
    return result
  }
  if (data) {
    data.task[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.task.customFields
    )
  }
  const task = new Task(data ? data.task : {})

  // mutates the object
  initInvisibleFields(task, Settings.fields.task.customFields)

  return (
    <div>
      <TaskForm
        edit
        initialValues={task}
        title={`${Settings.fields.task.shortLabel} ${task.shortName}`}
        notesComponent={
          <RelatedObjectNotes
            notes={task.notes}
            relatedObject={
              task.uuid && {
                relatedObjectType: Task.relatedObjectType,
                relatedObjectUuid: task.uuid,
                relatedObject: task
              }
            }
          />
        }
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TaskEdit)
