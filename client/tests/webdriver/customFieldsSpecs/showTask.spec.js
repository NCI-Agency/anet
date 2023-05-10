import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"
import ShowTask from "../pages/showTask.page"

// Load a task "1.2.B" from "A test report from Arthur"
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

  describe("When in the show page of a task with a parent task", () => {
    it("We should see a parent task that related to the current task", async() => {
      const parentTaskField = await await ShowTask.getParentTaskField()
      await (await ShowTask.getParentTaskField()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await parentTaskField.isExisting()).to.be.true
      expect(await (await ShowTask.getParentTask()).getText()).to.equal(
        "EF 1 » EF 1.2"
      )
    })
  })

  describe("When in the show page of a task without a children tasks", () => {
    it("We should not see list of children tasks", async() => {
      const childrenTasksField = await await ShowTask.getChildrenTasksField()
      // eslint-disable-next-line no-unused-expressions
      expect(await childrenTasksField.isExisting()).to.be.false
    })
  })
})

// Load a task "EF 1"
describe("Show task page", () => {
  beforeEach("Open the show task page", async() => {
    await ShowTask.openAsAdminUser(await ShowReport.getTaskEF1Url())
  })

  describe("When in the show page of a task without a parent task", () => {
    it("We should not see a parent task", async() => {
      const parentTaskField = await await ShowTask.getParentTaskField()
      // eslint-disable-next-line no-unused-expressions
      expect(await parentTaskField.isExisting()).to.be.false
    })
  })
  describe("When in the show page of a task with a children tasks", () => {
    it("We should see list of children tasks that related to the current task", async() => {
      const childrenTasks = await await ShowTask.getChildrenTasks()
      const childrenTasksField = await await ShowTask.getChildrenTasksField()
      if (await childrenTasks.isExisting()) {
        await (await ShowTask.getChildrenTasksField()).waitForDisplayed()
        // eslint-disable-next-line no-unused-expressions
        expect(await childrenTasksField.isExisting()).to.be.true
        expect(
          await (await ShowTask.getFirstItemFromChildrenTasks()).getText()
        ).to.equal("1.1")
      }
    })
  })
})
