import { PAGE_PROPS_NO_NAV } from "actions"
import API, { Settings } from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Organization, Task } from "models"
import React from "react"
import { connect } from "react-redux"
import utils from "utils"
import TaskForm from "./Form"

class TaskNew extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  state = {
    task: new Task()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    const qs = utils.parseQueryString(props.location.search)
    if (qs.responsibleOrgUuid) {
      return API.query(
        /* GraphQL */ `
          organization(uuid: $uuid) {
            uuid
            shortName
            longName
            identificationCode
            type
          }
        `,
        { uuid: qs.responsibleOrgUuid },
        "($uuid: String!)"
      ).then(data => {
        const { task } = this.state
        task.responsibleOrg = new Organization(data.organization)
        this.setState({ task })
      })
    }
  }

  render() {
    const { task } = this.state
    return (
      <TaskForm
        initialValues={task}
        title={`Create a new ${Settings.fields.task.shortLabel}`}
      />
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(TaskNew)
