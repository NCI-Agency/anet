import { Report } from 'models'
import { runGQL, fuzzy } from '../simutils'
import faker from 'faker'

const populateReport = function (report) {
    fuzzy.always() && (report.intent = faker.lorem.paragraph())
    fuzzy.always() && (report.engagementDate = faker.date.recent().toISOString())
    fuzzy.often() && (report.cancelledReason = faker.lorem.sentance())
    fuzzy.always() && (report.atmosphere = faker.random.arrayElement(["POSITIVE","NEUTRAL","NEGATIVE"]))
    fuzzy.often() && (report.atmosphereDetails = faker.lorem.sentance())
    fuzzy.often() && (report.location = {})
    fuzzy.often() && (report.attendees = [])
    fuzzy.sometimes() && (report.tasks = [])
    fuzzy.often() && (report.comments = Array.apply(null, { length: faker.random.number(10)})).map(Function.call, faker.lorem.sentance())
    fuzzy.often() && (report.reportText = faker.lorem.paragraphs())
    fuzzy.often() && (report.nextSteps = faker.lorem.sentance())
    fuzzy.often() && (report.keyOutcomes = faker.lorem.sentance())
    fuzzy.seldomly() && (report.tags = [])
    fuzzy.seldomly() && (report.reportSensitiveInformation = null) &&
        (report.authorizationGroups = [])
}

const createReport = async function (user) {
    const report = new Report()
    populateReport(report)
    const json = await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { createReport(report: $report) { uuid } }`,
            variables: { report: report }
        })
}

const updateDraftReport = async function (user) {

    const report = await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { updateReport(report: $report) { uuid } }`,
            variables: { report: report }
        })

    populateReport(report)
    const json = await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { updateReport(report: $report) { uuid } }`,
            variables: { report: report }
        })
}

export { createReport, updateDraftReport }
