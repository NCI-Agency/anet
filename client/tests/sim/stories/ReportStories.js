import { Report, Person, Position, Task, Location } from "models"
import faker from "faker"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _uniqWith from "lodash/uniqWith"
import { fuzzy, runGQL, populate } from "../simutils"
import { getRandomObject } from "./NoteStories"

const getRandomPerson = async function(user, hasPosition, type, role) {
  if (hasPosition) {
    const position = await getRandomObject(
      user,
      "positions",
      {
        status: Position.STATUS.ACTIVE,
        isFilled: true,
        type: type
      },
      "uuid type person { uuid name role }"
    )
    return position === null ? null : position.person
  } else {
    const person = await getRandomObject(
      user,
      "people",
      {
        role
      },
      "uuid name role"
    )
    return person
  }
}

async function populateReport(report, user, args) {
  const location = await getRandomObject(user, "locations", {
    status: Location.STATUS.ACTIVE
  })
  let author
  async function getAttendees() {
    const attendees = []
    const nbOfAdvisors = faker.random.number({ min: 1, max: 5 })
    let primary = true
    for (let i = 0; i < nbOfAdvisors; i++) {
      const advisor = await getRandomPerson(
        user,
        primary,
        [Position.TYPE.ADVISOR],
        Person.ROLE.ADVISOR
      )
      if (advisor) {
        advisor.primary = primary
        primary = false
        attendees.push(advisor)
      }
    }
    // Pick random advisor attendee as author
    const n = faker.random.number({ min: 0, max: attendees.length - 1 })
    author = Object.assign({}, attendees[n])
    delete author.primary

    const nbOfPrincipals = faker.random.number({ min: 1, max: 5 })
    primary = true
    for (let i = 0; i < nbOfPrincipals; i++) {
      const principal = await getRandomPerson(
        user,
        primary,
        [Position.TYPE.PRINCIPAL],
        Person.ROLE.PRINCIPAL
      )
      if (principal) {
        principal.primary = primary
        primary = false
        attendees.push(principal)
      }
    }

    const seenUuids = []
    return attendees.filter(a => {
      if (seenUuids.includes(a.uuid)) {
        return false
      } else {
        seenUuids.push(a.uuid)
        return true
      }
    })
  }
  const attendees = await getAttendees()
  async function getTasks() {
    const reportTasks = []
    const nbOfTasks = faker.random.number({ min: 1, max: 3 })

    for (let i = 0; i < nbOfTasks; i++) {
      reportTasks.push(
        await getRandomObject(user, "tasks", { status: Task.STATUS.ACTIVE })
      )
    }

    return [..._uniqWith(reportTasks, _isEqual)]
  }
  const tasks = await getTasks()
  const engagementDate = faker.date.recent(365)
  const state = fuzzy.withProbability(0.05)
    ? Report.STATE.CANCELLED
    : (args && args.state) || Report.STATE.DRAFT
  const cancelledReason =
    state !== Report.STATE.CANCELLED
      ? null
      : faker.random.arrayElement([
        "CANCELLED_BY_ADVISOR",
        "CANCELLED_BY_PRINCIPAL",
        "CANCELLED_DUE_TO_TRANSPORTATION",
        "CANCELLED_DUE_TO_FORCE_PROTECTION",
        "CANCELLED_DUE_TO_ROUTES",
        "CANCELLED_DUE_TO_THREAT"
      ])

  const template = {
    intent: () => faker.lorem.paragraph(),
    engagementDate: engagementDate.toISOString(),
    duration: () => faker.random.number({ min: 1, max: 480 }),
    cancelledReason,
    atmosphere: () =>
      faker.random.arrayElement(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
    atmosphereDetails: () => faker.lorem.sentence(),
    location,
    author,
    attendees,
    tasks,
    reportText: () => faker.lorem.paragraphs(),
    nextSteps: () => faker.lorem.sentence(),
    keyOutcomes: () => faker.lorem.sentence(),
    tags: () => [],
    reportSensitiveInformation: () => null,
    authorizationGroups: () => [],
    state,
    releasedAt: () => {
      // Set the releasedAt value on a random date between 1 and 7 days after the engagement
      const result = new Date(engagementDate)
      result.setSeconds(
        result.getSeconds() +
          (Math.floor(Math.random() * (60 * 60 * 24 * 7)) + 1)
      )
      return result
    }
  }

  populate(report, template)
    .intent.always()
    .engagementDate.always()
    .duration.often()
    .cancelledReason.always()
    .atmosphere.always()
    .atmosphereDetails.always()
    .location.always()
    .author.always()
    .attendees.always()
    .tasks.always()
    .reportText.always()
    .nextSteps.always()
    .keyOutcomes.always()
    .tags.rarely()
    .reportSensitiveInformation.and()
    .authorizationGroups.rarely()
    .state.always()
    .releasedAt.always()

  return report
}

const createReport = async function(user, grow, args) {
  const report = Object.without(new Report(), "formCustomFields")
  if (await populateReport(report, user, args)) {
    console.debug(`Creating report ${report.intent.green}`)
    const { reportTags, cancelled, ...reportStripped } = report // TODO: we need to do this more generically

    return (
      await runGQL(user, {
        query:
          "mutation($report: ReportInput!) { createReport(report: $report) { uuid } }",
        variables: { report: reportStripped }
      })
    ).data.createReport
  }
}

const updateDraftReport = async function(user) {
  const totalCount = (
    await runGQL(user, {
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
    })
  ).data.reportList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.random.number({ max: totalCount - 1 })
  const reports = (
    await runGQL(user, {
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
    })
  ).data.reportList.list
  const report = !_isEmpty(reports) && reports[0]
  if (!report) {
    return null
  }

  if (await populateReport(report, user)) {
    return (
      await runGQL(user, {
        query:
          "mutation($report: ReportInput!) { updateReport(report: $report) { uuid } }",
        variables: { report: report }
      })
    ).data.updateReport
  }
}

const submitDraftReport = async function(user) {
  const totalCount = (
    await runGQL(user, {
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
    })
  ).data.reportList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.random.number({ max: totalCount - 1 })
  const reports = (
    await runGQL(user, {
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
    })
  ).data.reportList.list
  const report = _isEmpty(reports) && reports[0]
  if (!report) {
    return null
  }

  return (
    await runGQL(user, {
      query: "mutation($uuid: String!) { submitReport(uuid: $uuid) { uuid } }",
      variables: { uuid: report.uuid }
    })
  ).data.submitReport
}

const approveReport = async function(user) {
  const totalCount = (
    await runGQL(user, {
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
    })
  ).data.reportList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.random.number({ max: totalCount - 1 })
  const reports = (
    await runGQL(user, {
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
    })
  ).data.reportList.list
  const report = _isEmpty(reports) && reports[0]
  if (!report) {
    return null
  }

  return (
    await runGQL(user, {
      query:
        "mutation ($uuid: String!) { approveReport(uuid: $uuid) { uuid } }",
      variables: { uuid: report.uuid }
    })
  ).data.approveReport
}

export { createReport, updateDraftReport, submitDraftReport, approveReport }
