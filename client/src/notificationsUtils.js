// import { useMyTasks } from "pages/tasks/MyTasks"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Model from "components/Model"
import Task from "models/Task"
import { useContext } from "react"

// TODO: which fields enough to calculate pending assessment count
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
  status: "ACTIVE"
}

export const useNotifications = () => {
  const { currentUser } = useContext(AppContext)
  const taskQuery = {
    ...baseTaskQuery,
    responsiblePositionUuid: currentUser.position.uuid
  }
  const { data: tasksData } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })

  let unAssessedTasks = []
  const unAssessedCounterParts = currentUser.position.associatedPositions
    .map(asPos => asPos.person)
    .filter(Model.hasPendingAssessments)

  if (tasksData?.taskList?.list?.length) {
    unAssessedTasks = tasksData.taskList.list
      .map(obj => new Task(obj))
      .map(Model.populateAssessmentsCustomFields)
      .filter(Model.hasPendingAssessments)
  }

  return {
    myCounterparts: unAssessedCounterParts.length,
    myTasks: unAssessedTasks.length
  }
}
