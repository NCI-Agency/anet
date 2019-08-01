import { PAGE_PROPS_NO_NAV } from "actions"
import API, { Settings } from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Task } from "models"
import React from "react"
import { connect } from "react-redux"
import TaskForm from "./Form"

class TaskEdit extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  static modelName = "Task"

  state = {
    task: new Task()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
      task(uuid:"${props.match.params.uuid}") {
        uuid, shortName, longName, status,
        customField, customFieldEnum1, customFieldEnum2,
        plannedCompletion, projectedCompletion,
        responsibleOrg { uuid, shortName, longName, identificationCode },
        customFieldRef1 { uuid, shortName, longName }
        responsiblePositions { uuid, name, code, type, status, organization { uuid, shortName}, person { uuid, name, rank, role, avatar(size: 32) } }
        ${GRAPHQL_NOTES_FIELDS}
      }
    `
    ).then(data => {
      this.setState({ task: new Task(data.task) })
    })
  }

  render() {
    const { task } = this.state
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
}

export default connect(
  null,
  mapDispatchToProps
)(TaskEdit)
