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
          createdAt
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
  const { data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })

  const unAssessedCounterParts = currentUser.position.associatedPositions
    .map(asPos => asPos.person)
    .filter(Model.hasPendingAssessments)

  let unAssessedTasks = []
  if (data?.taskList?.list?.length) {
    const taskObjects = data.taskList.list.map(obj => new Task(obj))

    taskObjects.forEach(task => {
      Model.populateAssessmentsCustomFields(task)
    })
    unAssessedTasks = taskObjects.filter(Model.hasPendingAssessments)
  }
  return {
    myCounterparts: unAssessedCounterParts.length,
    myTasks: unAssessedTasks.length
  }
}
