import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import GQL from "graphqlapi"
import { Task } from "models"
import React from "react"
import Kanban from "components/Kanban"
import { Settings } from "api"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"

class PrioritiesDashboard extends Page {
  static propTypes = { ...pagePropTypes }

  constructor(props) {
    super(props)
    this.state = { tasks: [] }
  }

  fetchData(props) {
    const taskQuery = {
      pageNum: 0,
      pageSize: 0,
      status: Task.STATUS.ACTIVE
    }
    const tasksPart = new GQL.Part(/* GraphQL */ `
      taskList(query: $taskQuery) {
        list {
          uuid, longName, shortName, customFieldEnum1, createdAt, updatedAt
          responsibleOrg { uuid, shortName}
        }
      }`).addVariable("taskQuery", "TaskSearchQueryInput", taskQuery)
    GQL.run([tasksPart]).then(data => {
      const tasks = data.taskList.list
      this.setState({
        tasks: tasks
      })
    })
  }

  render() {
    return <Kanban {...{ ...Settings.dashboards[this.props.match.params.dashboard], ...this.state }} />
  }
}

export default connect(
  null,
  mapDispatchToProps
)(withRouter(PrioritiesDashboard))
