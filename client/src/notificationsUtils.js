// import { useMyTasks } from "pages/tasks/MyTasks"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Model from "components/Model"
import moment from "moment"
// import { GRAPHQL_NOTES_FIELDS } from "components/Model"
import { useContext } from "react"

const GQL_GET_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      totalCount
      list {
        customFields
        notes {
          updatedAt
          type
          text
        }
      }
    }
  }
`

const baseTaskQuery = {
  responsiblePositionUuid: "",
  sortBy: "NAME",
  sortOrder: "ASC",
  status: "ACTIVE"
}

export const useNotifications = () => {
  const { currentUser } = useContext(AppContext)
  const taskQuery = {
    ...baseTaskQuery,
    responsiblePositionUuid: currentUser.position.uuid
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })

  if (loading || error) {
    return null
  }
  if (data?.taskList?.list[0]?.notes[0]) {
    Model.populateAssessmentsCustomFields(data.taskList.list[0])
    console.log(data.taskList.list[0])
    console.log(moment(data.taskList.list[0].notes[0].updatedAt))
  }
  return {
    myCounterparts: currentUser?.position?.associatedPositions?.length,
    myTasks: data?.taskList?.totalCount || 0
  }
}
