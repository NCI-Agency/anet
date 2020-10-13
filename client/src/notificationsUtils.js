import API from "api"
import { gql } from "apollo-boost"
import Model from "components/Model"
import { Person, Task } from "models"

export const GET_NOTIFICATIONS_NOTES = `
customFields
notes {
  noteRelatedObjects {
    noteUuid
  }
  createdAt
  type
  text
}
`

// TODO: which fields enough to calculate pending assessment count
// TODO: can we also add this to the app data fetch to fetch once and for all
export const GQL_GET_MY_PENDING_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      totalCount
      pageNum
      pageSize
      list {
        uuid
        shortName
        longName
        customFieldRef1 {
          uuid
        }
        ${GET_NOTIFICATIONS_NOTES}
      }
    }
  }
`

const baseTaskQuery = {
  responsiblePositionUuid: "",
  status: "ACTIVE"
}

export const useNotifications = (currentUser, skipQuery) => {
  const respPosUuid = currentUser?.position?.uuid
  // don't even query if user has no position
  const skip = !respPosUuid || skipQuery

  const [taskData, loadingTask, refetchTasks] = useMyPendingTasks(
    respPosUuid,
    skip
  )

  const pendingCParts = getPendingCounterparts(currentUser)
  const pendingTasks = getPendingTasks(taskData)

  const notifications = {
    myCounterparts: pendingCParts.length,
    myTasks: pendingTasks.length
  }

  // FIXME: should we show indication about error in notifications? app probably works fine without it.
  return [notifications, loadingTask, refetchTasks]
}

const useMyPendingTasks = (respPosUuid, skip) => {
  const taskQuery = {
    ...baseTaskQuery,
    responsiblePositionUuid: respPosUuid
  }
  const { loading, data, refetch } = API.useApiQuery(
    GQL_GET_MY_PENDING_TASK_LIST,
    {
      taskQuery
    },
    skip
  )

  return [data, loading, refetch]
}

export const getPendingTasks = taskData => {
  if (taskData?.taskList?.list?.length) {
    const taskObjects = taskData.taskList.list.map(obj => new Task(obj))
    taskObjects.forEach(task => {
      Model.populateAssessmentsCustomFields(task)
    })
    return taskObjects.filter(Model.hasPendingAssessments)
  }
  return []
}

export const getPendingCounterparts = currentUser => {
  if (currentUser?.position?.associatedPositions?.length) {
    return currentUser.position.associatedPositions.filter(pos => {
      if (pos.person) {
        return Model.hasPendingAssessments(new Person(pos.person))
      }
      return false
    })
  }
  return []
}
