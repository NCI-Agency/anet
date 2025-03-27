import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import EventMatrix from "components/EventMatrix"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import TaskTree from "components/TaskTree"
import React from "react"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_TOP_LEVEL_TASKS = gql`
  query {
    taskList(query: { parentTaskUuid: "-1", pageSize: 0 }) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        selectable
        parentTask {
          uuid
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
        descendantTasks {
          uuid
          shortName
          longName
          selectable
          parentTask {
            uuid
          }
          ascendantTasks {
            uuid
            shortName
            parentTask {
              uuid
            }
          }
        }
      }
    }
  }
`

interface TopTasksProps {
  pageDispatchers?: PageDispatchersPropType
}

const TopTasks = ({ pageDispatchers }: TopTasksProps) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_TOP_LEVEL_TASKS)
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(Settings.fields.task.allTasksLabel)

  if (done) {
    return result
  }

  return (
    <>
      <Fieldset title={Settings.fields.task.allTasksLabel}>
        {(!data?.taskList?.list?.length && (
          <div>No {Settings.fields.task.allTasksLabel}</div>
        )) || <TaskTree tasks={data.taskList.list} />}
      </Fieldset>
      <Fieldset id="syncMatrix" title="Sync Matrix">
        <EventMatrix tasks={data.taskList.list} />
      </Fieldset>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(TopTasks)
