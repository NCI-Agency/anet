import Model from "components/Model"
import { Person, Task } from "models"

export const GRAPHQL_NOTIFICATIONS_NOTE_FIELDS = `
  customFields
  notes {
    noteRelatedObjects {
      objectUuid
    }
    createdAt
    type
    assessmentKey
    text
  }
`

export const getNotifications = position => ({
  counterpartsWithPendingAssessments:
    getCounterpartsWithPendingAssessments(position),
  tasksWithPendingAssessments: getTasksWithPendingAssessments(position)
})

export const getTasksWithPendingAssessments = position => {
  if (position?.responsibleTasks?.length) {
    const taskObjects = position.responsibleTasks
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

export const getCounterpartsWithPendingAssessments = position => {
  if (position?.associatedPositions?.length) {
    return position.associatedPositions.filter(pos => {
      if (pos.person) {
        return Model.hasPendingAssessments(new Person(pos.person))
      }
      return false
    })
  }
  return []
}
