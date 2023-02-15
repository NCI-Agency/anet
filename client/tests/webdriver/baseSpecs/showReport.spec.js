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
})
