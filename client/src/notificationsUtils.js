import API from "api"
import { gql } from "apollo-boost"
import Model from "components/Model"
import { Person, Task } from "models"

const commonNoteFields = `
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
export const GQL_GET_MY_PENDING_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      totalCount
      pageNum
      pageSize
      list {
        uuid
        customFields
        shortName
        longName
        customFieldRef1 {
          uuid
        }
        ${commonNoteFields}
      }
    }
  }
`
const GQL_GET_MY_COUNTERPARTS = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      position {
        associatedPositions {
          person {
            customFields
            name
            ${commonNoteFields}
          }
        }
      }
    }
  }
`

const baseTaskQuery = {
  responsiblePositionUuid: "",
  status: "ACTIVE"
}

export const useNotifications = (currentUser, skipQuery) => {
  const uuid = currentUser?.uuid
  const respPosUuid = currentUser?.position?.uuid
  // don't even query if user has no position
  const skip = !respPosUuid || skipQuery

  const [taskData, loadingTask] = useMyPendingTasks(respPosUuid, skip)
  const [personData, laodingPerson] = useMyPendingCounterparts(uuid, skip)

  const pendingCParts = getPendingCounterparts(personData)
  const pendingTasks = getPendingTasks(taskData)

  const notifications = {
    myCounterparts: pendingCParts.length,
    myTasks: pendingTasks.length
  }
  const loading = loadingTask || laodingPerson

  // FIXME: should we show indication about error in notifications? app probably works fine without it.
  return [notifications, loading]
}

const useMyPendingTasks = (respPosUuid, skip) => {
  const taskQuery = {
    ...baseTaskQuery,
    responsiblePositionUuid: respPosUuid
  }
  const { loading, data } = API.useApiQuery(
    GQL_GET_MY_PENDING_TASK_LIST,
    {
      taskQuery
    },
    skip
  )

  return [data, loading]
}

const useMyPendingCounterparts = (uuid, skip) => {
  const { loading, data } = API.useApiQuery(
    GQL_GET_MY_COUNTERPARTS,
    {
      uuid
    },
    skip
  )

  return [data, loading]
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

const getPendingCounterparts = personData => {
  if (personData?.person?.position?.associatedPositions?.length) {
    return personData.person.position.associatedPositions
      .map(asPos => asPos.person)
      .filter(person => person)
      .map(person => new Person(person))
      .filter(Model.hasPendingAssessments)
  }
  return []
}
