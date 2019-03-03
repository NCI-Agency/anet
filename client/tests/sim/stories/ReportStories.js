import { Report } from 'models'
import { runGQL, populate } from '../simutils'
import faker from 'faker'

const populateReport = function (report) {

    const emptyArray = () => { return [] }
    const emptyObject = () => { return {} }
    const template = {
        intent: faker.lorem.paragraph,
        engagementDate: () => faker.date.recent().toISOString(),
        cancelledReason: () => faker.random.arrayElement(["CANCELLED_BY_ADVISOR","CANCELLED_BY_PRINCIPAL","CANCELLED_DUE_TO_TRANSPORTATION","CANCELLED_DUE_TO_FORCE_PROTECTION","CANCELLED_DUE_TO_ROUTES","CANCELLED_DUE_TO_THREAT"]),
        atmosphere: () => faker.random.arrayElement(["POSITIVE","NEUTRAL","NEGATIVE"]),
        atmosphereDetails: faker.lorem.sentence,
        location: emptyObject,
        attendees: emptyArray,
        tasks: emptyArray,
        reportText: faker.lorem.paragraphs,
        nextSteps: faker.lorem.sentence,
        keyOutcomes: faker.lorem.sentence,
        tags: emptyArray,
        reportSensitiveInformation: () => null,
        authorizationGroups: emptyArray
    }

    populate(report, template)
        .intent.always()
        .engagementDate.always()
        .cancelledReason.often()
        .atmosphere.always()
        .atmosphereDetails.often()
        .location.often()
        .attendees.often()
        .tasks.sometimes()
        .reportText.often()
        .nextSteps.often()
        .keyOutcomes.often()
        .tags.rarely()
        .reportSensitiveInformation.and().authorizationGroups.rarely()
    }

const createReport = async function (user) {
    const report = new Report()
    populateReport(report)

    const {reportTags, cancelled, ...reportStripped} = report // TODO: we need to do this more generically

    return await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { createReport(report: $report) { uuid } }`,
            variables: { report: reportStripped }
        })
}

const updateDraftReport = async function (user) {

    const reports = await runGQL(user,
        {
            query: `query {
                reportList(query: {pageNum: 0, pageSize: 0, state:DRAFT, authorUuid: "${user.person.uuid}"}) {
                  list {
                    uuid
                  }
                }
              }
            }`,
            variables: {}
        })
    const report = faker.random.arrayElement(reports.data.reportList.list)

    populateReport(report)
    const json = await runGQL(user,
        {
            query: `mutation($report: ReportInput!) { updateReport(report: $report) { uuid } }`,
            variables: { report: report }
        })
}

export { createReport, updateDraftReport }
