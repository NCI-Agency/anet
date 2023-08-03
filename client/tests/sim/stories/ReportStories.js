import { faker } from "@faker-js/faker"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _uniqWith from "lodash/uniqWith"
import { Location, Person, Position, Report } from "models"
import { fuzzy, populate, runGQL } from "../simutils"
import { getRandomObject } from "./NoteStories"

const getRandomPerson = async function(user, hasPosition, type, role) {
  if (hasPosition) {
    const position = await getRandomObject(
      user,
      "positions",
      {
        status: Model.STATUS.ACTIVE,
        isFilled: true,
        type
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
    status: Model.STATUS.ACTIVE,
    type: fuzzy.withProbability(0.75)
      ? Location.LOCATION_TYPES.PRINCIPAL_LOCATION
      : fuzzy.withProbability(0.95)
        ? Location.LOCATION_TYPES.ADVISOR_LOCATION
        : Location.LOCATION_TYPES.VIRTUAL_LOCATION
  })
  async function getAttendees() {
    const reportPeople = []
    const nbOfAdvisors = faker.number.int({ min: 1, max: 5 })
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
        advisor.attendee = true
        // Set the first random advisor attendee as author
        advisor.author = i === 0
        primary = false
        reportPeople.push(advisor)
      }
    }

    const nbOfPrincipals = faker.number.int({ min: 1, max: 5 })
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
        principal.attendee = true
        principal.author = false
        primary = false
        reportPeople.push(principal)
      }
    }

    const seenUuids = []
    return reportPeople.filter(a => {
      if (seenUuids.includes(a.uuid)) {
        return false
      } else {
        seenUuids.push(a.uuid)
        return true
      }
    })
  }
  const reportPeople = await getAttendees()
  async function getTasks() {
    const reportTasks = []
    const nbOfTasks = faker.number.int({ min: 1, max: 3 })

    for (let i = 0; i < nbOfTasks; i++) {
      reportTasks.push(
        await getRandomObject(user, "tasks", { status: Model.STATUS.ACTIVE })
      )
    }

    return [..._uniqWith(reportTasks, _isEqual)]
  }
  const tasks = await getTasks()
  const engagementDate = faker.date.recent({ days: 365 })
  const state = fuzzy.withProbability(0.05)
    ? Report.STATE.CANCELLED
    : (args && args.state) || Report.STATE.DRAFT
  const cancelledReason =
    state !== Report.STATE.CANCELLED
      ? null
      : faker.helpers.arrayElement([
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
    duration: () => faker.number.int({ min: 1, max: 480 }),
    cancelledReason,
    atmosphere: () =>
      faker.helpers.arrayElement(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
    atmosphereDetails: () => faker.lorem.sentence(),
    location,
    reportPeople,
    tasks,
    reportText: () => faker.lorem.paragraphs(),
    nextSteps: () => faker.lorem.sentence(),
    keyOutcomes: () => faker.lorem.sentence(),
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
    .reportPeople.always()
    .tasks.always()
    .reportText.always()
    .nextSteps.always()
    .keyOutcomes.always()
    .reportSensitiveInformation.and()
    .authorizationGroups.rarely()
    .state.always()
    .releasedAt.always()

  return report
}

const createReport = async function(user, grow, args) {
  const report = Report.filterClientSideFields(new Report())
  if (await populateReport(report, user, args)) {
    console.debug(`Creating report ${report.intent.green}`)
    const { cancelled, ...reportStripped } = report // TODO: we need to do this more generically

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
  const random = faker.number.int({ max: totalCount - 1 })
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
            reportPeople {
              uuid
              author
              primary
              attendee
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
        variables: { report }
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
  const random = faker.number.int({ max: totalCount - 1 })
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
  const random = faker.number.int({ max: totalCount - 1 })
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
