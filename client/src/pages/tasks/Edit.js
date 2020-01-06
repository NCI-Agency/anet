import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Task } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import TaskForm from "./Form"

const GQL_GET_TASK = gql`
  query($uuid: String!) {
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
      responsibleOrg {
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
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const TaskEdit = props => {
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
    ...props
  })
  if (done) {
    return result
  }
  if (data) {
    data.task.formCustomFields = JSON.parse(data.task.customFields)
  }
  const task = new Task(data ? data.task : {})

  return (
    <div>
      <RelatedObjectNotes
        notes={task.notes}
        relatedObject={
          task.uuid && {
            relatedObjectType: "tasks",
            relatedObjectUuid: task.uuid
          }
        }
      />
      <TaskForm
        edit
        initialValues={task}
        title={`${Settings.fields.task.shortLabel} ${task.shortName}`}
      />
    </div>
  )
}

TaskEdit.propTypes = {
  ...pagePropTypes
}

export default connect(null, mapDispatchToProps)(TaskEdit)
