import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"

describe("Show report page", () => {
  beforeEach("Open the show report page", async() => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
  })
  describe("When on the show page of a report with assessments", () => {
    it("We should see a table of tasks instant assessments related to the current report", async() => {
      await (
        await ShowReport.getTasksEngagementAssessments()
      ).waitForDisplayed()
      // Both 1.2.A as 1.2.B tasks on the page have an svg type of assessment (LikertScale widgets)
      // and two other questions
      const svgAssessments = await (
        await ShowReport.getTasksEngagementAssessments()
      ).$$("svg")
      expect(svgAssessments).to.have.length(2)
      const question2Assessments = await (
        await ShowReport.getTasksEngagementAssessments()
      ).$$("[name*=question2]")
      expect(question2Assessments).to.have.length(2)
      const question3Assessments = await (
        await ShowReport.getTasksEngagementAssessments()
      ).$$("[name*=question3]")
      expect(question3Assessments).to.have.length(2)
    })
  })
  describe("When on the show page of a report with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      // Attachment container
      await (await ShowReport.getAttachments()).waitForExist()
      await (await ShowReport.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      // Attachment card list
      await (await ShowReport.getCard()).waitForExist()
      await (await ShowReport.getCard()).waitForDisplayed()
      expect(await ShowReport.getCaption()).to.be.equal("Arthur's test report")
    })
    it("We can go to the show page of Attachment", async() => {
      await (await ShowReport.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/f076406f-1a9b-4fc9-8ab2-cd2a138ec26d"
      )
    })
  })
})

const REPORT_CLASSIFICATION = "NATO UNCLASSIFIED"
describe("Show report page with classification", () => {
  beforeEach("Open the show report page", async() => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A classified report from Arthur",
      REPORT_STATES.DRAFT
    )
  })
  describe("When on the show page of a report with classification", () => {
    it("We should see the classification related to the current report", async() => {
      await (await ShowReport.getClassification()).waitForExist()
      await (await ShowReport.getClassification()).waitForDisplayed()
      expect(await (await ShowReport.getClassification()).getText()).to.equal(
        REPORT_CLASSIFICATION
      )
    })
  })
})
