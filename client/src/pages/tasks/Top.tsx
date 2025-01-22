import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import TaskTree from "pages/tasks/Tree"
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"

const GQL_GET_TOP_LEVEL_TASKS = gql`
  query {
    taskList(query: { pageSize: 0 }) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        parentTask {
          uuid
        }
        descendantTasks {
          uuid
        }
      }
    }
  }
`

interface TopTasksProps {
  pageDispatchers?: PageDispatchersPropType
}

const TopTasks = ({ pageDispatchers }: TopTasksProps) => {
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })

  const [topLevelTasks, setTopLevelTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopLevelTasks = async() => {
      try {
        const { data } = await API.client.query({
          query: GQL_GET_TOP_LEVEL_TASKS
        })
        if (data?.taskList?.list) {
          const tasks = data.taskList.list.filter(task => !task.parentTask)
          setTopLevelTasks(tasks)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTopLevelTasks()
  }, [])

  if (loading) {
    return <div>Loading tasks...</div>
  }

  if (topLevelTasks.length === 0) {
    return <div>No to be displayed</div>
  }

  return (
    <div>
      <TaskTree tasks={topLevelTasks} />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TopTasks)
