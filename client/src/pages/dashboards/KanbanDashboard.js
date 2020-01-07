import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import Kanban from "components/Kanban"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import { LAST_MONTH } from "dateUtils"
import { Task } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"

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
        lastMonthReports: reports(query: {
          pageSize:0,
          engagementDateStart: ${LAST_MONTH},
          engagementDateEnd: 0
        }) {
          uuid
        }
        preLastMonthReports: reports(query: {
          pageSize:0,
          engagementDateStart: ${2 * LAST_MONTH},
          engagementDateEnd: ${LAST_MONTH}
        }) {
          uuid
        }

      }
    }
  }
`

const KanbanDashboard = props => {
  const { dashboard } = useParams()
  const dashboardSettings = Settings.dashboards.find(o => o.label === dashboard)
  const [dashboardData, setDashboardData] = useState({})
  useEffect(() => {
    async function fetchData() {
      await fetch(dashboardSettings.data)
        .then(response => response.json())
        .then(setDashboardData)
    }
    fetchData()
  }, [dashboardSettings.data])

  return <KanbanDashboardImpl dashboardData={dashboardData} {...props} />
}

KanbanDashboard.propTypes = { ...pagePropTypes }

const KanbanDashboardImpl = props => {
  const { dashboardData } = props
  const taskQuery = {
    pageNum: 0,
    pageSize: 0,
    status: Task.STATUS.ACTIVE
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })
  if (done) {
    return result
  }

  const tasks = data ? data.taskList.list : []

  return !dashboardData.title ? null : (
    <Kanban tasks={tasks} {...dashboardData} />
  )
}

KanbanDashboardImpl.propTypes = {
  ...pagePropTypes,
  dashboardData: PropTypes.object
}

export default connect(null, mapDispatchToProps)(KanbanDashboard)
