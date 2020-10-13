import API from "api"
import { gql } from "apollo-boost"
import Model from "components/Model"
import { Person, Task } from "models"

export const GRAPHQL_NOTIFICATIONS_NOTE_FIELDS = `
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
export const GQL_GET_MY_TASKS_LIST = gql`
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
        ${GRAPHQL_NOTIFICATIONS_NOTE_FIELDS}
      }
    }
  }
`

const baseTaskQuery = {
  responsiblePositionUuid: "",
  status: "ACTIVE"
}

export const useNotifications = (currentUser, skipQuery) => {
  const responsiblePosUuid = currentUser?.position?.uuid
  // don't even query if user has no position
  const skip = !responsiblePosUuid || skipQuery

  const [
    myTasksWithPendingAssessments,
    loadingTask,
    refetchTasks
  ] = useMyTasksWithPendingAssessments(responsiblePosUuid, skip)

  const myCounterpartsWithPendingAssessments = getMyCounterpartsWithPendingAssessments(
    currentUser
  )

  const notifications = {
    myCounterpartsWithPendingAssessments:
      myCounterpartsWithPendingAssessments.length,
    myTasksWithPendingAssessments: myTasksWithPendingAssessments.length
  }

  // FIXME: should we show indication about error in notifications? app probably works fine without it.
  return [notifications, loadingTask, refetchTasks]
}

const useMyTasksWithPendingAssessments = (responsiblePosUuid, skip) => {
  const taskQuery = {
    ...baseTaskQuery,
    responsiblePositionUuid: responsiblePosUuid
  }
  const { loading, data, refetch } = API.useApiQuery(
    GQL_GET_MY_TASKS_LIST,
    {
      taskQuery
    },
    skip
  )
  const myTasksWithPendingAssessments = getMyTasksWithPendingAssessments(data)

  return [myTasksWithPendingAssessments, loading, refetch]
}

export const getMyTasksWithPendingAssessments = taskData => {
  if (taskData?.taskList?.list?.length) {
    const taskObjects = taskData.taskList.list.map(obj => new Task(obj))
    taskObjects.forEach(task => {
      // Tasks can have specific custom fields
      Model.populateCustomFields(task)
    })
    return taskObjects.filter(Model.hasPendingAssessments)
  }
  return []
}

export const getMyCounterpartsWithPendingAssessments = currentUser => {
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
