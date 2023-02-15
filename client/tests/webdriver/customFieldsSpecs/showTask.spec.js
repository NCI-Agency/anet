import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"
import ShowTask from "../pages/showTask.page"

describe("Show task page", () => {
  beforeEach("Open the show task page", async() => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
    await ShowTask.openAsAdminUser(await ShowReport.getTask12BUrl())
  })

  describe("When on the show page of a task with assessments", () => {
    it("We should see a table of assessments related to the current task", async() => {
      await (await ShowTask.getAssessmentResultsMonthly()).waitForDisplayed()
      const question1AssessmentMonthly = await (
        await ShowTask.getAssessmentResultsMonthly()
      ).$("[id*=question1-assessment]")
      // eslint-disable-next-line no-unused-expressions
      expect(await question1AssessmentMonthly.isExisting()).to.be.true

      await (await ShowTask.getAssessmentResultsWeekly()).waitForDisplayed()
      const question1AssessmentWeekly = await (
        await ShowTask.getAssessmentResultsWeekly()
      ).$("[id*=question1-assessment]")
      // eslint-disable-next-line no-unused-expressions
      expect(await question1AssessmentWeekly.isExisting()).to.be.true
    })
  })
})
