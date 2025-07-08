import { expect } from "chai"
import ShowTask from "../pages/showTask.page"

const TASK_12B_UUID = "9d3da7f4-8266-47af-b518-995f587250c9"
const TASK_EF1_UUID = "1145e584-4485-4ce0-89c4-2fa2e1fe846a"
const TASK_EF1_2_UUID = "fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0"

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
  describe("When in the show page as an admin", () => {
    it("Should open and close the Edit Engagement planning approvals modal correctly", async() => {
      const editButton =
        await ShowTask.getEditEngagementPlanningApprovalsButton()
      await editButton.waitForExist()
      await editButton.waitForDisplayed()
      await editButton.click()
      const modal = await ShowTask.getEditApprovalsModal()
      await modal.waitForExist()
      await modal.waitForDisplayed()
      const modalTitle = await modal.$(".modal-title")
      expect(await modalTitle.getText()).to.equal(
        "Edit Engagement planning approval process"
      )
      const closeButton = await ShowTask.getModalCloseButton()
      await closeButton.click()
      await modal.waitForExist({ reverse: true })
    })
    it("Should open and close the Edit Report publication approvals modal correctly", async() => {
      const editButton =
        await ShowTask.getEditReportPublicationApprovalsButton()
      await editButton.waitForExist()
      await editButton.waitForDisplayed()
      await editButton.click()
      const modal = await ShowTask.getEditApprovalsModal()
      await modal.waitForExist()
      await modal.waitForDisplayed()
      const modalTitle = await modal.$(".modal-title")
      expect(await modalTitle.getText()).to.equal(
        "Edit Report publication approval process"
      )
      const closeButton = await ShowTask.getModalCloseButton()
      await closeButton.click()
      await modal.waitForExist({ reverse: true })
    })
  })
})

describe("Show task page", () => {
  describe("When in the show page of a task with children tasks", () => {
    it("the task's full path should be displayed in the event matrix", async() => {
      await ShowTask.openAsAdminUser(TASK_EF1_2_UUID)
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(4)

      const containsStarIcon = await tasks.map(
        async task =>
          await (await task.$(".bp6-popover-target img")).isExisting()
      )
      // only first task (self) should contain the task icon
      expect(containsStarIcon).to.deep.equal([true, false, false, false])

      const taskPath = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      // only first task (self) should contain the full path,
      // the remaining ones should contain what comes after the current task
      expect(taskPath).to.deep.equal([
        "EF 1.2",
        "» 1.2.A",
        "» 1.2.B",
        "» 1.2.C"
      ])
    })
  })
})
