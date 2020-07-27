import { expect } from "chai"
import MyReports from "../pages/myReports.page"
import ShowReport from "../pages/showReport.page"

describe("Show report page", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open()
    ShowReport.openAsAdminUser(MyReports.reportWithAssessmentsUrl)
  })
  describe("When on the show page of a report with assessments", () => {
    it("We should see a table of tasks instant assessments related to the current report", () => {
      ShowReport.tasksEngagementAssessments.waitForDisplayed()
      // Both 1.2.A as 1.2.B tasks on the page have an svg type of assessment (LikertScale widgets)
      const svgAssessments = ShowReport.tasksEngagementAssessments.$$("svg")
      expect(svgAssessments).to.have.length(2)
      // Check on assessments of task 1.2.A
      const question2Assessments = ShowReport.tasksEngagementAssessments.$$(
        "[name*=question2]"
      )
      expect(question2Assessments).to.have.length(1)
      const question3Assessments = ShowReport.tasksEngagementAssessments.$$(
        "[name*=question3]"
      )
      expect(question3Assessments).to.have.length(1)
    })
  })
})
