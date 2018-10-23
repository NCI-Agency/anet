import { Report } from 'models'
import { runGQL, fuzzy } from '../simutils'
import faker from 'faker'

const populateReport = function (report) {
    fuzzy.always() && (report.intent = faker.lorem.paragraph())
    fuzzy.always() && (report.engagementDate = faker.date.recent().toISOString())
    fuzzy.often() && (report.cancelledReason = faker.random.arrayElement(["CANCELLED_BY_ADVISOR","CANCELLED_BY_PRINCIPAL","CANCELLED_DUE_TO_TRANSPORTATION","CANCELLED_DUE_TO_FORCE_PROTECTION","CANCELLED_DUE_TO_ROUTES","CANCELLED_DUE_TO_THREAT"]))
    fuzzy.always() && (report.atmosphere = faker.random.arrayElement(["POSITIVE","NEUTRAL","NEGATIVE"]))
    fuzzy.often() && (report.atmosphereDetails = faker.lorem.sentence())
    fuzzy.often() && (report.location = {})
    fuzzy.often() && (report.attendees = [])
    fuzzy.sometimes() && (report.tasks = [])
    // fuzzy.often() && (report.comments = Array.apply(null, { length: faker.random.number(10)})).map(Function.call, faker.lorem.sentence())
    fuzzy.often() && (report.reportText = faker.lorem.paragraphs())
    fuzzy.often() && (report.nextSteps = faker.lorem.sentence())
    fuzzy.often() && (report.keyOutcomes = faker.lorem.sentence())
    fuzzy.seldomly() && (report.tags = [])
    fuzzy.seldomly() && (report.reportSensitiveInformation = null) &&
        (report.authorizationGroups = [])
}

const createReport = async function (user) {
    const report = new Report()
    populateReport(report)
    return await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { createReport(report: $report) { uuid } }`,
            variables: { report: report }
        })
}

const updateDraftReport = async function (user) {

    const report = await runGQL(user,
        {
            query: `query {
                reportList(query: {pageNum: 0, pageSize: 0, authorUuid: "${user.person.uuid}"}) {
                  list {
                    uuid
                  }
                }
              }
            }`,
            variables: {}
        })

    populateReport(report)
    const json = await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { updateReport(report: $report) { uuid } }`,
            variables: { report: report }
        })
}

export { createReport, updateDraftReport }
