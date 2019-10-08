import { Report, Position, Task, Location } from "models"
import faker from "faker"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _uniqWith from "lodash/uniqWith"
import { runGQL, populate } from "../simutils"

async function getRandomPerson(user, variables) {
  const positionsQuery = Object.assign({}, variables, {
    pageNum: 0,
    pageSize: 1
  })
  const totalCount = (await runGQL(user, {
    query: `
        query ($positionsQuery: PositionSearchQueryInput) {
          positionList(query: $positionsQuery) {
            totalCount
          }
        }
      `,
    variables: {
      positionsQuery
    }
  })).data.positionList.totalCount
  let positions = null
  if (totalCount > 0) {
    positionsQuery.pageNum = faker.random.number({ max: totalCount - 1 })
    positions = (await runGQL(user, {
      query: `
          query ($positionsQuery: PositionSearchQueryInput) {
            positionList(query: $positionsQuery) {
              list {
                uuid
                type
                person {
                  uuid
                  name
                  role
                }
              }
            }
          }
        `,
      variables: {
        positionsQuery
      }
    })).data.positionList.list
  }
  return _isEmpty(positions) ? null : positions[0].person
}

export const randomAdvisor = async function(user) {
  return getRandomPerson(user, {
    status: Position.STATUS.ACTIVE,
    isFilled: true,
    type: [Position.TYPE.ADVISOR]
  })
}

export const randomPrincipal = async function(user) {
  return getRandomPerson(user, {
    status: Position.STATUS.ACTIVE,
    isFilled: true,
    type: [Position.TYPE.PRINCIPAL]
  })
}

async function populateReport(report, user, args) {
  const emptyArray = () => {
    return []
  }

  /* eslint-disable no-unused-vars */
  const emptyObject = () => {
    return {}
  }
  /* eslint-enable no-unused-vars */

  async function activeLocation() {
    const totalCount = (await runGQL(user, {
      query: `
        query ($locationQuery: LocationSearchQueryInput) {
          locationList(query: $locationQuery) {
            totalCount
          }
        }
      `,
      variables: {
        locationQuery: {
          pageNum: 0,
          pageSize: 1,
          status: Location.STATUS.ACTIVE
        }
      }
    })).data.locationList.totalCount
    let activeLocations = null
    if (totalCount > 0) {
      const random = faker.random.number({ max: totalCount - 1 })
      activeLocations = (await runGQL(user, {
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
            pageNum: random,
            pageSize: 1,
            status: Location.STATUS.ACTIVE
          }
        }
      })).data.locationList.list
    }
    return _isEmpty(activeLocations) ? null : activeLocations[0]
  }

  async function activeTask() {
    const totalCount = (await runGQL(user, {
      query: `
        query ($taskQuery: TaskSearchQueryInput) {
          taskList(query: $taskQuery) {
            totalCount
          }
        }
      `,
      variables: {
        taskQuery: {
          pageNum: 0,
          pageSize: 1,
          status: Task.STATUS.ACTIVE
        }
      }
    })).data.taskList.totalCount
    let activeTasks = null
    if (totalCount > 0) {
      const random = faker.random.number({ max: totalCount - 1 })
      activeTasks = (await runGQL(user, {
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
            pageNum: random,
            pageSize: 1,
            status: Task.STATUS.ACTIVE
          }
        }
      })).data.taskList.list
    }
    return _isEmpty(activeTasks) ? null : activeTasks[0]
  }

  const location = await activeLocation()
  async function getAttendees() {
    const attendees = []
    const nbOfAdvisors = faker.random.number({ min: 1, max: 5 })
    for (let i = 0; i < nbOfAdvisors; i++) {
      const advisor = await randomAdvisor(user)
      if (advisor) {
        advisor.primary = i === 0
        attendees.push(advisor)
      }
    }

    const nbOfPrincipals = faker.random.number({ min: 1, max: 5 })
    for (let i = 0; i < nbOfPrincipals; i++) {
      const principal = await randomPrincipal(user)
      if (principal) {
        principal.primary = i === 0
        attendees.push(principal)
      }
    }

    return [..._uniqWith(attendees, _isEqual)]
  }
  const attendees = await getAttendees()
  async function getTasks() {
    const reportTasks = []
    const nbOfTasks = faker.random.number({ min: 1, max: 3 })

    for (let i = 0; i < nbOfTasks; i++) {
      reportTasks.push(await activeTask())
    }

    return [..._uniqWith(reportTasks, _isEqual)]
  }
  const tasks = await getTasks()
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
    location,
    attendees,
    tasks,
    reportText: () => faker.lorem.paragraphs(),
    nextSteps: () => faker.lorem.sentence(),
    keyOutcomes: () => faker.lorem.sentence(),
    tags: emptyArray,
    reportSensitiveInformation: () => null,
    authorizationGroups: emptyArray,
    state: (args && args.state) || Report.STATE.DRAFT
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
    .state.always()

  return report
}

const createReport = async function(user, grow, args) {
  const report = new Report()
  if (await populateReport(report, user, args)) {
    console.debug(`Creating report ${report.intent.green}`)
    const { reportTags, cancelled, ...reportStripped } = report // TODO: we need to do this more generically

    return (await runGQL(user, {
      query:
        "mutation($report: ReportInput!) { createReport(report: $report) { uuid } }",
      variables: { report: reportStripped }
    })).data.createReport
  }
}

const updateDraftReport = async function(user) {
  const totalCount = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: 0,
          pageSize: 1,
          state: ${Report.STATE.DRAFT},
          authorUuid: "${user.person.uuid}"
        }) {
          totalCount
        }
      }
    `,
    variables: {}
  })).data.reportList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.random.number({ max: totalCount - 1 })
  const reports = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: ${random},
          pageSize: 1,
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
  const report = !_isEmpty(reports) && reports[0]
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
  const totalCount = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: 0,
          pageSize: 1,
          state: ${Report.STATE.DRAFT},
          authorUuid: "${user.person.uuid}"
        }) {
          totalCount
        }
      }
    `,
    variables: {}
  })).data.reportList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.random.number({ max: totalCount - 1 })
  const reports = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: ${random},
          pageSize: 1,
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
  const report = _isEmpty(reports) && reports[0]
  if (!report) {
    return null
  }

  return (await runGQL(user, {
    query: "mutation($uuid: String!) { submitReport(uuid: $uuid) { uuid } }",
    variables: { uuid: report.uuid }
  })).data.submitReport
}

const approveReport = async function(user) {
  const totalCount = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: 0,
          pageSize: 1,
          pendingApprovalOf: "${user.person.uuid}"
        }) {
          totalCount
        }
      }
    `,
    variables: {}
  })).data.reportList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.random.number({ max: totalCount - 1 })
  const reports = (await runGQL(user, {
    query: `
      query {
        reportList(query: {
          pageNum: ${random},
          pageSize: 1,
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
  const report = _isEmpty(reports) && reports[0]
  if (!report) {
    return null
  }

  return (await runGQL(user, {
    query: "mutation ($uuid: String!) { approveReport(uuid: $uuid) { uuid } }",
    variables: { uuid: report.uuid }
  })).data.approveReport
}

export { createReport, updateDraftReport, submitDraftReport, approveReport }
