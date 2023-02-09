import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"
import ShowTask from "../pages/showTask.page"

describe("Show task page", () => {
  beforeEach("Open the show task page", () => {
    MyReports.open("arthur")
    MyReports.selectReport("A test report from Arthur", REPORT_STATES.PUBLISHED)
    ShowTask.openAsAdminUser(ShowReport.getTask12BUrl())
  })

  describe("When on the show page of a task with assessments", () => {
    it("We should see a table of assessments related to the current task", () => {
      ShowTask.getAssessmentResultsMonthly().waitForDisplayed()
      const question1AssessmentMonthly =
        ShowTask.getAssessmentResultsMonthly().$("[id*=question1-assessment]")
      // eslint-disable-next-line no-unused-expressions
      expect(question1AssessmentMonthly.isExisting()).to.be.true

      ShowTask.getAssessmentResultsWeekly().waitForDisplayed()
      const question1AssessmentWeekly = ShowTask.getAssessmentResultsWeekly().$(
        "[id*=question1-assessment]"
      )
      // eslint-disable-next-line no-unused-expressions
      expect(question1AssessmentWeekly.isExisting()).to.be.true
    })
  })
})
