import { expect } from "chai"
import MyReports from "../pages/myReports.page"
import ShowReport from "../pages/showReport.page"
import ShowTask from "../pages/showTask.page"

describe("Show task page", () => {
  beforeEach("Open the show task page", () => {
    MyReports.open()
    ShowReport.openAsAdminUser(MyReports.reportWithAssessmentsUrl)
    ShowTask.openAsAdminUser(ShowReport.task12BUrl)
  })

  describe("When on the show page of a task with assessments", () => {
    it("We should see a table of assessments related to the current task", () => {
      ShowTask.assessmentResultsMonthly.waitForDisplayed()
      const frenchFlagAssessmentMonthly = ShowTask.assessmentResultsMonthly.$(
        "id*=frenchFlag-assessment"
      )
      expect(frenchFlagAssessmentMonthly.isExisting())

      ShowTask.assessmentResultsWeekly.waitForDisplayed()
      const frenchFlagAssessmentWeekly = ShowTask.assessmentResultsWeekly.$(
        "id*=levels-assessment"
      )
      expect(frenchFlagAssessmentWeekly.isExisting())
    })
  })
})
