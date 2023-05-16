import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
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
      }
      ascendantTasks(query: { pageNum: 0, pageSize: 0 }) {
        uuid
        shortName
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
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const TaskEdit = ({ pageDispatchers }) => {
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

TaskEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(TaskEdit)
