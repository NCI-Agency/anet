import { faker } from "@faker-js/faker"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _uniqWith from "lodash/uniqWith"
import { Location, Position, Report } from "models"
import {
  createHtmlParagraphs,
  fuzzy,
  getRandomObject,
  populate,
  runGQL
} from "../simutils"

const getRandomPerson = async function() {
  return await getRandomObject(
    "people",
    { positionType: Object.values(Position.TYPE) },
    "uuid name"
  )
}

async function getAuthorizedMembers() {
  const authorizedMemberTypes = {
    authorizationGroups: {
      status: Model.STATUS.ACTIVE,
      forSensitiveInformation: true
    },
    organizations: { status: Model.STATUS.ACTIVE },
    people: { status: Model.STATUS.ACTIVE, pendingVerification: false },
    positions: { status: Model.STATUS.ACTIVE }
  }
  const nrOfAuthorizedMembers = faker.number.int({ min: 1, max: 5 })
  const authorizedMembers = []
  const authorizedMemberUuids = new Set()
  for (let i = 0; i < nrOfAuthorizedMembers; i++) {
    const authorizedMemberType = faker.helpers.arrayElement(
      Object.keys(authorizedMemberTypes)
    )
    const authorizedMember = await getRandomObject(
      authorizedMemberType,
      authorizedMemberTypes[authorizedMemberType]
    )
    if (
      authorizedMember?.uuid &&
      !authorizedMemberUuids.has(authorizedMember.uuid)
    ) {
      authorizedMemberUuids.add(authorizedMember.uuid)
      authorizedMembers.push({
        relatedObjectType: authorizedMemberType,
        relatedObjectUuid: authorizedMember.uuid
      })
    }
  }
  return authorizedMembers
}

async function populateReport(report, args) {
  const location = await getRandomObject("locations", {
    status: Model.STATUS.ACTIVE,
    type: fuzzy.withProbability(0.75)
      ? Location.LOCATION_TYPES.POINT_LOCATION
      : Location.LOCATION_TYPES.VIRTUAL_LOCATION
  })
  async function getAttendees() {
    let reportPeople = []
    const nbOfAdvisors = faker.number.int({ min: 1, max: 5 })
    for (let i = 0; i < nbOfAdvisors; i++) {
      const advisor = await getRandomPerson()
      if (advisor) {
        reportPeople.push({
          ...advisor,
          primary: false,
          attendee: true,
          interlocutor: false,
          author: false
        })
      }
    }

    const nbOfInterlocutors = faker.number.int({ min: 1, max: 5 })
    for (let i = 0; i < nbOfInterlocutors; i++) {
      const interlocutor = await getRandomPerson()
      if (interlocutor) {
        reportPeople.push({
          ...interlocutor,
          primary: false,
          attendee: true,
          interlocutor: true,
          author: false
        })
      }
    }

    // Make sure attendees are unique
    const seenUuids = []
    reportPeople = reportPeople.filter(a => {
      if (seenUuids.includes(a.uuid)) {
        return false
      } else {
        seenUuids.push(a.uuid)
        return true
      }
    })

    // Make sure we have primaries and an author
    const firstAdvisor = reportPeople.find(a => !a.interlocutor)
    if (firstAdvisor) {
      firstAdvisor.primary = true
      firstAdvisor.author = true
    }
    const firstInterlocutor = reportPeople.find(a => a.interlocutor)
    if (firstInterlocutor) {
      firstInterlocutor.primary = true
      if (!firstAdvisor) {
        // Make this an author and advisor
        firstInterlocutor.author = true
        firstInterlocutor.interlocutor = false
      }
    }
    return reportPeople
  }
  const reportPeople = await getAttendees()
  async function getTasks() {
    const reportTasks = []
    const nbOfTasks = faker.number.int({ min: 1, max: 3 })

    for (let i = 0; i < nbOfTasks; i++) {
      reportTasks.push(
        await getRandomObject("tasks", { status: Model.STATUS.ACTIVE })
      )
    }

    return [..._uniqWith(reportTasks, _isEqual)]
  }
  const tasks = await getTasks()
  const engagementDate = fuzzy.withProbability(0.9)
    ? faker.date.past()
    : faker.date.future()
  const state = fuzzy.withProbability(0.05)
    ? Report.STATE.CANCELLED
    : (args && args.state) || Report.STATE.DRAFT
  const cancelledReason =
    state !== Report.STATE.CANCELLED
      ? null
      : faker.helpers.arrayElement([
        "CANCELLED_BY_ADVISOR",
        "CANCELLED_BY_INTERLOCUTOR",
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
    reportText: async() => await createHtmlParagraphs(),
    nextSteps: () => faker.lorem.sentence(),
    keyOutcomes: () => faker.lorem.sentence(),
    reportSensitiveInformation: async() => ({
      text: await createHtmlParagraphs()
    }),
    authorizedMembers: async() => await getAuthorizedMembers(),
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

  const reportGenerator = await populate(report, template)
  await reportGenerator.intent.always()
  await reportGenerator.engagementDate.always()
  await reportGenerator.duration.often()
  await reportGenerator.cancelledReason.always()
  await reportGenerator.atmosphere.always()
  await reportGenerator.atmosphereDetails.always()
  await reportGenerator.location.always()
  await reportGenerator.reportPeople.always()
  await reportGenerator.tasks.always()
  await reportGenerator.reportText.always()
  await reportGenerator.nextSteps.always()
  await reportGenerator.keyOutcomes.always()
  await reportGenerator.reportSensitiveInformation
    .and()
    .authorizedMembers.rarely()
  await reportGenerator.state.always()
  await reportGenerator.releasedAt.always()

  return report
}

const createReport = async function(user, grow, args) {
  const report = Report.filterClientSideFields(new Report())
  if (await populateReport(report, args)) {
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
              interlocutor
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

  if (await populateReport(report)) {
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
