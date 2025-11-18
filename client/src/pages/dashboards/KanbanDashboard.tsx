import {
  gqlAllTaskFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Kanban from "components/Kanban"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { LAST_MONTH } from "dateUtils"
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"

const GQL_GET_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      list {
        ${gqlAllTaskFields}
        taskedOrganizations {
          ${gqlEntityFieldsMap.Task}
        }
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
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

interface KanbanDashboardProps {
  pageDispatchers?: PageDispatchersPropType
}

const KanbanDashboard = ({ pageDispatchers }: KanbanDashboardProps) => {
  const { dashboard } = useParams()
  const dashboardSettings = Settings.dashboards.find(o => o.label === dashboard)
  const [dashboardData, setDashboardData] = useState({})
  usePageTitle("Dashboard")
  useEffect(() => {
    fetch(dashboardSettings.data)
      .then(response => response.json())
      .then(setDashboardData)
      .catch(error =>
        console.error(
          "Error fetching",
          dashboardSettings.type,
          "dashboard",
          dashboardSettings.data,
          ":",
          error
        )
      )
  }, [dashboardSettings.data, dashboardSettings.type])

  return (
    <KanbanDashboardImpl
      dashboardData={dashboardData}
      pageDispatchers={pageDispatchers}
    />
  )
}

interface KanbanDashboardImplProps {
  pageDispatchers?: PageDispatchersPropType
  dashboardData?: any
}

const KanbanDashboardImpl = ({
  pageDispatchers,
  dashboardData
}: KanbanDashboardImplProps) => {
  const taskQuery = {
    pageNum: 0,
    pageSize: 0,
    status: Model.STATUS.ACTIVE
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const tasks = data ? data.taskList.list : []

  return !dashboardData.title ? null : (
    <Kanban allTasks={tasks} {...dashboardData} />
  )
}

export default connect(null, mapPageDispatchersToProps)(KanbanDashboard)
