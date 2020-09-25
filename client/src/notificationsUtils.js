// import { useMyTasks } from "pages/tasks/MyTasks"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Model from "components/Model"
import { Person, Task } from "models"
import { useContext } from "react"

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
const GQL_GET_MY_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      totalCount
      list {
        customFieldRef1 {
          uuid
        }
        customFields
        shortName
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

export const useNotifications = () => {
  const { currentUser } = useContext(AppContext)
  console.dir(currentUser)
  const taskQuery = {
    ...baseTaskQuery,
    responsiblePositionUuid: currentUser.position.uuid
  }
  // don't even query if user has no position
  const skip = !currentUser?.position?.uuid
  const { data: taskData } = API.useApiQuery(
    GQL_GET_MY_TASK_LIST,
    {
      taskQuery
    },
    skip
  )
  const { data: personData } = API.useApiQuery(
    GQL_GET_MY_COUNTERPARTS,
    {
      uuid: currentUser.uuid
    },
    skip
  )

  let unAssessedCounterParts = []
  if (personData?.person?.position?.associatedPositions?.length) {
    unAssessedCounterParts = personData.person.position.associatedPositions
      .map(asPos => asPos.person)
      .map(person => new Person(person))
      .filter(Model.hasPendingAssessments)
  }

  let unAssessedTasks = []
  if (taskData?.taskList?.list?.length) {
    const taskObjects = taskData.taskList.list.map(obj => new Task(obj))

    taskObjects.forEach(task => {
      Model.populateAssessmentsCustomFields(task)
    })
    unAssessedTasks = taskObjects.filter(Model.hasPendingAssessments)
  }

  return {
    myCounterparts:
      unAssessedCounterParts.length >= 10
        ? "10+"
        : unAssessedCounterParts.length,
    myTasks: unAssessedTasks.length >= 10 ? "10+" : unAssessedTasks.length
  }
}
