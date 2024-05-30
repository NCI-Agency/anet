import { expect } from "chai"
import ShowTask from "../pages/showTask.page"

const TASK_12B_UUID = "9d3da7f4-8266-47af-b518-995f587250c9"
const TASK_EF1_UUID = "1145e584-4485-4ce0-89c4-2fa2e1fe846a"

describe("Show task page", () => {
  beforeEach("Open the show task page", async() => {
    await ShowTask.openAsAdminUser(TASK_12B_UUID)
  })

  describe("When on the show page of a task with assessments", () => {
    it("We should see a table of assessments related to the current task", async() => {
      await (
        await ShowTask.getAssessmentResults("taskOnceReport", "monthly")
      ).waitForDisplayed()
      const question1AssessmentMonthly = await (
        await ShowTask.getAssessmentResults("taskOnceReport", "monthly")
      ).$("[id*=question1-assessment]")
      // eslint-disable-next-line no-unused-expressions
      expect(await question1AssessmentMonthly.isExisting()).to.be.true
    })
  })

  describe("When in the show page of a task with a parent task", () => {
    it("We should see a parent task that related to the current task", async() => {
      await (await ShowTask.getParentTaskField()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getParentTaskField()).isExisting()).to.be
        .true
      expect(await (await ShowTask.getParentTask()).getText()).to.equal(
        "EF 1 » EF 1.2"
      )
    })
  })

  describe("When in the show page of a task without children tasks", () => {
    it("We should not see list of children tasks", async() => {
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getChildrenTasksField()).isExisting()).to.be
        .false
    })
  })
})

describe("Show task page", () => {
  beforeEach("Open the show task page", async() => {
    await ShowTask.openAsAdminUser(TASK_EF1_UUID)
  })

  describe("When in the show page of a task without a parent task", () => {
    it("We should not see a parent task", async() => {
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getParentTaskField()).isExisting()).to.be
        .false
    })
  })
  describe("When in the show page of a task with children tasks", () => {
    it("We should see list of children tasks that related to the current task", async() => {
      await (await ShowTask.getChildrenTasks()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getChildrenTasksField()).isExisting()).to.be
        .true
      expect(
        await (await ShowTask.getFirstItemFromChildrenTasks()).getText()
      ).to.equal("1.1")
    })
  })
})
