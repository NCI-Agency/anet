import { PAGE_PROPS_NO_NAV } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Organization, Task } from "models"
import React from "react"
import { connect } from "react-redux"
import utils from "utils"
import TaskForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      type
    }
  }
`

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
      return API.query(GQL_GET_ORGANIZATION, {
        uuid: qs.responsibleOrgUuid
      }).then(data => {
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
