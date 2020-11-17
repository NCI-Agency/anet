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

export const getNotifications = currentUser => {
  const myCounterpartsWithPendingAssessments = getMyCounterpartsWithPendingAssessments(
    currentUser
  )

  const myTasksWithPendingAssessments = getMyTasksWithPendingAssessments(
    currentUser
  )

  const notifications = {
    myCounterpartsWithPendingAssessments,
    myTasksWithPendingAssessments
  }

  return notifications
}

export const getMyTasksWithPendingAssessments = currentUser => {
  if (currentUser?.position?.responsibleTasks?.length) {
    const taskObjects = currentUser.position.responsibleTasks
      .filter(obj => obj)
      .map(obj => new Task(obj))
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
