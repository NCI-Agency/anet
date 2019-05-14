import { Person, Report, Task, Location } from "models"
import faker from "faker"
import _isEmpty from "lodash/isEmpty"
import { runGQL, populate } from "../simutils"
import Position from "../../../src/models/Position"

const populateReport = async function(report, user) {
  const emptyArray = () => {
    return []
  }
  const emptyObject = () => {
    return {}
  }

  const activeLocations = (await runGQL(user, {
    query: `
      query ($locationQuery: LocationSearchQueryInput) {
        locationList(query: $locationQuery) {
          list {
            uuid
          }
        }
      }
    `,
    variables: {
      locationQuery: {
        pageNum: 0,
        pageSize: 0,
        status: Location.STATUS.ACTIVE
      }
    }
  })).data.locationList.list

  const activeTasks = (await runGQL(user, {
    query: `
      query ($taskQuery: TaskSearchQueryInput) {
        taskList(query: $taskQuery) {
          list {
            uuid
          }
        }
      }
    `,
    variables: {
      taskQuery: {
        pageNum: 0,
        pageSize: 0,
        status: Task.STATUS.ACTIVE
      }
    }
  })).data.taskList.list

  const assignedAdvisors = (await runGQL(user, {
    query: `
      query ($peopleQuery: PersonSearchQueryInput) {
        personList(query: $peopleQuery) {
          list {
            uuid
            role
            position {
              uuid
              status
            }
          }
        }
      }
    `,
    variables: {
      peopleQuery: {
        pageNum: 0,
        pageSize: 0,
        role: Person.ROLE.ADVISOR
      }
    }
  })).data.personList.list.filter(
    p => p.position && p.position.status === Position.STATUS.ACTIVE
  )

  const assignedPrincipals = (await runGQL(user, {
    query: `
      query ($peopleQuery: PersonSearchQueryInput) {
        personList(query: $peopleQuery) {
          list {
            uuid
            role
            position {
              uuid
              status
            }
          }
        }
      }
    `,
    variables: {
      peopleQuery: {
        pageNum: 0,
        pageSize: 0,
        role: Person.ROLE.PRINCIPAL
      }
    }
  })).data.personList.list.filter(
    p => p.position && p.position.status === Position.STATUS.ACTIVE
  )

  if (
    _isEmpty(activeLocations) ||
    _isEmpty(activeTasks) ||
    _isEmpty(assignedPrincipals) ||
    _isEmpty(assignedAdvisors)
  ) {
    return false
  }

  const template = {
    intent: () => faker.lorem.paragraph(),
    engagementDate: () => faker.date.recent().toISOString(),
    duration: () => faker.random.number({ min: 1, max: 480 }),
    cancelledReason: () =>
      faker.random.arrayElement([
        "CANCELLED_BY_ADVISOR",
        "CANCELLED_BY_PRINCIPAL",
        "CANCELLED_DUE_TO_TRANSPORTATION",
        "CANCELLED_DUE_TO_FORCE_PROTECTION",
        "CANCELLED_DUE_TO_ROUTES",
        "CANCELLED_DUE_TO_THREAT"
      ]),
    atmosphere: () =>
      faker.random.arrayElement(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
    atmosphereDetails: () => faker.lorem.sentence(),
    location: () => {
      return faker.random.arrayElement(activeLocations)
    },
    attendees: () => {
      const attendees = new Set()
      const nbOfAdvisors = faker.random.number({ min: 1, max: 5 })
      for (let i = 0; i < nbOfAdvisors; i++) {
        const advisor = faker.random.arrayElement(assignedAdvisors)
        advisor.primary = i === 0
        attendees.add(advisor)
      }

      const nbOfPrincipals = faker.random.number({ min: 1, max: 5 })
      for (let i = 0; i < nbOfPrincipals; i++) {
        const principal = faker.random.arrayElement(assignedPrincipals)
        principal.primary = i === 0
        attendees.add(principal)
      }

      return [...attendees]
    },
    tasks: () => {
      const reportTasks = new Set()
      const nbOfTasks = faker.random.number({ min: 1, max: 3 })

      for (let i = 0; i < nbOfTasks; i++) {
        reportTasks.add(faker.random.arrayElement(activeTasks))
      }

      return [...reportTasks]
    },
    reportText: () => faker.lorem.paragraphs(),
    nextSteps: () => faker.lorem.sentence(),
    keyOutcomes: () => faker.lorem.sentence(),
    tags: emptyArray,
    reportSensitiveInformation: () => null,
    authorizationGroups: emptyArray
  }

  populate(report, template)
    .intent.always()
    .engagementDate.always()
    .duration.often()
    .cancelledReason.often()
    .atmosphere.always()
    .atmosphereDetails.always()
    .location.always()
    .attendees.always()
    .tasks.always()
    .reportText.always()
    .nextSteps.always()
    .keyOutcomes.always()
    .tags.rarely()
    .reportSensitiveInformation.and()
    .authorizationGroups.rarely()

  return report
}

const createReport = async function(user) {
  const report = new Report()
  if (await populateReport(report, user)) {
    const { reportTags, cancelled, ...reportStripped } = report // TODO: we need to do this more generically

    return (await runGQL(user, {
      query:
        "mutation($report: ReportInput!) { createReport(report: $report) { uuid } }",
      variables: { report: reportStripped }
    })).data.createReport
  }
}

const updateDraftReport = async function(user) {
  const reports = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: 0,
          pageSize: 0,
          state: ${Report.STATE.DRAFT},
          authorUuid: "${user.person.uuid}"
        }) {
          list {
            uuid
            intent
            engagementDate
            duration
            keyOutcomes
            nextSteps
            cancelledReason
            atmosphere
            atmosphereDetails
            attendees {
              uuid
              primary
            }
          }
        }
      }
    `,
    variables: {}
  })).data.reportList.list
  const report = faker.random.arrayElement(reports)
  if (!report) {
    return null
  }

  if (await populateReport(report, user)) {
    return (await runGQL(user, {
      query:
        "mutation($report: ReportInput!) { updateReport(report: $report) { uuid } }",
      variables: { report: report }
    })).data.updateReport
  }
}

const submitDraftReport = async function(user) {
  const reports = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: 0,
          pageSize: 0,
          state: ${Report.STATE.DRAFT},
          authorUuid: "${user.person.uuid}"
        }) {
          list {
            uuid
          }
        }
      }
    `,
    variables: {}
  })).data.reportList.list
  const report = faker.random.arrayElement(reports)
  if (!report) {
    return null
  }

  return (await runGQL(user, {
    query: "mutation($uuid: String!) { submitReport(uuid: $uuid) { uuid } }",
    variables: { uuid: report.uuid }
  })).data.submitReport
}

const approveReport = async function(user) {
  const reports = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: 0,
          pageSize: 0,
          pendingApprovalOf: "${user.person.uuid}"
        }) {
          list {
            uuid
          }
        }
      }
    `,
    variables: {}
  })).data.reportList.list
  const report = faker.random.arrayElement(reports)
  if (!report) {
    return null
  }

  return (await runGQL(user, {
    query: "mutation ($uuid: String!) { approveReport(uuid: $uuid) { uuid } }",
    variables: { uuid: report.uuid }
  })).data.approveReport
}

export { createReport, updateDraftReport, submitDraftReport, approveReport }
