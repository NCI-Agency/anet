import API, { Settings } from "api"
import { gql } from "apollo-boost"
import Kanban from "components/Kanban"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Task } from "models"
import React from "react"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { LAST_MONTH } from "dateUtils"

const GQL_GET_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      list {
        uuid
        longName
        shortName
        customFieldEnum1
        createdAt
        updatedAt
        responsibleOrg {
          uuid
          shortName
        }
        allReports: reports {
          uuid
        }
        lastMonthReports: reports(query:{pageSize:0, engagementDateStart: ${LAST_MONTH},engagementDateEnd: 0}  ) {
          uuid
        }
        preLastMonthReports: reports(query:{pageSize:0, engagementDateStart: ${2 *
          LAST_MONTH},engagementDateEnd: ${LAST_MONTH}}  ) {
          uuid
        }

      }
    }
  }
`

class KanbanDashboard extends Page {
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

    const dashboardSettings = Settings.dashboards.find(
      o => o.label === this.props.match.params.dashboard
    )

    fetch(dashboardSettings.data)
      .then(response => response.json())
      .then(dashboardData =>
        API.query(GQL_GET_TASK_LIST, { taskQuery }).then(data => {
          const tasks = data.taskList.list
          this.setState({
            tasks: tasks,
            ...dashboardData
          })
        })
      )
  }

  render() {
    return this.state.title ? <Kanban {...{ ...this.state }} /> : null
  }
}

export default connect(
  null,
  mapDispatchToProps
)(withRouter(KanbanDashboard))
