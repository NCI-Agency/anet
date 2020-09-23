// import { useMyTasks } from "pages/tasks/MyTasks"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import { GRAPHQL_NOTES_FIELDS } from "components/Model"
import { useContext } from "react"

const GQL_GET_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      totalCount
      list {
        uuid
        shortName
        customFields
        ${GRAPHQL_NOTES_FIELDS}
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
  return {
    myCounterparts: currentUser?.position?.associatedPositions?.length,
    myTasks: data?.taskList?.totalCount || 0
  }
}
