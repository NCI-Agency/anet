import { expect } from "chai"
import MergeTasks from "../pages/mergeTasks.page"
import ShowTask from "../pages/showTask.page"

const TASK_12B_UUID = "9d3da7f4-8266-47af-b518-995f587250c9"
const TASK_EF1_UUID = "1145e584-4485-4ce0-89c4-2fa2e1fe846a"
const TASK_EF1_2_UUID = "fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0"
const TASK_TEST_1_UUID = "0baf4493-7fd8-423a-8ba3-43e8386d11a7"
const TASK_TEST_1_1_UUID = "33c87d55-9f90-4a23-903a-f7d176444de3"
const TASK_TEST_1_1_1_UUID = "36d8b14c-40b2-4bbe-9d15-9b964381f549"
const TASK_TEST_1_1_1_1_UUID = "c38c7c84-66cc-4978-9cf6-b07d10a50667"

const TASK_12B_ASSIGNED_TASKS = ["1.2.B"]

describe("Show task page", () => {
  beforeEach("Open the show task page", async () => {
    await ShowTask.openAsAdminUser(TASK_12B_UUID)
  })

  describe("When on the show page of a task with assessments", () => {
    it("We should see a table of assessments related to the current task", async () => {
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
    it("We should see a parent task that related to the current task", async () => {
      await (await ShowTask.getParentTaskField()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getParentTaskField()).isExisting()).to.be
        .true
      expect(await (await ShowTask.getParentTask()).getText()).to.equal(
        "EF 1\n»\nEF 1.2"
      )
    })
  })

  describe("When in the show page of a task without children tasks", () => {
    it("We should not see list of children tasks", async () => {
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getChildrenTasksField()).isExisting()).to.be
        .false
    })
  })

  describe("When in the show page of a task with a matrix", () => {
    it("Should see sync matrix on the 1.2.B Show page", async () => {
      await ShowTask.openAsAdminUser(TASK_12B_UUID)
      const syncMatrix = await ShowTask.getSyncMatrix()
      await syncMatrix.waitForExist()
      await syncMatrix.waitForDisplayed()

      expect(await (await syncMatrix.$(".legend")).getText()).to.contain(
        "Sync Matrix for EF 1 » EF 1.2 » 1.2.B"
      )

      const eventSeries = await ShowTask.getEventMatrixEventSeries()
      // Additional eventSeries may have been created during the tests!
      expect(eventSeries).to.have.lengthOf.at.least(1)
      const eventSeriesText = (
        await eventSeries.map(async es => await es.getText())
      ).join(" ; ")
      expect(eventSeriesText).to.include("NMI PDT")
      expect(eventSeriesText).to.include("My active NMI test event")
      expect(eventSeriesText).to.include("My inactive NMI test event")
      expect(eventSeriesText).to.include("Inactive event series")
      expect(eventSeriesText).to.include("My active test event")
      expect(eventSeriesText).to.include("My inactive test event")

      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(1)
      const taskPaths = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      expect(taskPaths).to.deep.equal(TASK_12B_ASSIGNED_TASKS)

      // Move to the previous period, the inactive eventSeries should no longer be shown
      await ShowTask.gotoPreviousPeriod()
      const eventSeriesPrev = await ShowTask.getEventMatrixEventSeries()
      const eventSeriesPrevText = (
        await eventSeriesPrev.map(async es => await es.getText())
      ).join(" ; ")
      expect(eventSeriesPrevText).to.include("NMI PDT")
      expect(eventSeriesPrevText).to.not.include("My active NMI test event")
      expect(eventSeriesPrevText).to.not.include("My inactive NMI test event")
      expect(eventSeriesPrevText).to.not.include("Inactive event series")
      expect(eventSeriesPrevText).to.not.include("My active test event")
      expect(eventSeriesPrevText).to.not.include("My inactive test event")

      const tasksPrev = await ShowTask.getEventMatrixTasks()
      expect(tasksPrev.length).to.equal(1)
      const tasksPrevPaths = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      expect(tasksPrevPaths).to.deep.equal(TASK_12B_ASSIGNED_TASKS)
    })
  })
})

describe("Show task page", () => {
  beforeEach("Open the show task page", async () => {
    await ShowTask.openAsAdminUser(TASK_EF1_UUID)
  })

  describe("When in the show page of a task without a parent task", () => {
    it("We should not see a parent task", async () => {
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowTask.getParentTaskField()).isExisting()).to.be
        .false
    })
  })
  describe("When in the show page of a task with children tasks", () => {
    it("We should see list of children tasks that related to the current task", async () => {
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
    it("We can select to merge it with another task", async () => {
      await ShowTask.openAsAdminUser(TASK_12B_UUID)
      await (await ShowTask.getMergeButton()).click()
      await browser.pause(500) // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergeTasks.getTitle()).to.exist
      expect(await (await MergeTasks.getLeftTaskField()).getValue()).to.contain(
        "1.2.B"
      )
      // eslint-disable-next-line no-unused-expressions
      expect(await (await MergeTasks.getLeftTaskField()).isEnabled()).to.be
        .false
    })
    it("Should open and close the Edit Engagement planning approvals modal correctly", async () => {
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
    it("Should open and close the Edit Report publication approvals modal correctly", async () => {
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
    it("the task's full path should be displayed in the event matrix", async () => {
      // only first task (self) should contain the full path,
      // the remaining ones should contain what comes after the current task
      const EF1_2_MATRIX_TASKS = ["EF 1.2", "»\n1.2.A", "»\n1.2.B", "»\n1.2.C"]
      await ShowTask.openAsAdminUser(TASK_EF1_2_UUID)
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(EF1_2_MATRIX_TASKS.length)

      const containsStarIcon = await tasks.map(
        async task =>
          await (await task.$(".bp6-popover-target img")).isExisting()
      )
      // only first task (self) should contain the task icon
      expect(containsStarIcon).to.deep.equal([true, false, false, false])

      const taskPath = await tasks.map(
        async task => await (await task.$("td:first-child")).getText()
      )
      expect(taskPath).to.deep.equal(EF1_2_MATRIX_TASKS)
    })
  })
  describe("When editing a task and setting it to inactive", () => {
    it("should display a modal with all the affected children tasks to confirm", async () => {
      await ShowTask.openAsAdminUser(`${TASK_TEST_1_UUID}/edit`)
      const inactiveButton = await browser.$('label[for="status_INACTIVE"]')
      await inactiveButton.waitForExist()
      await inactiveButton.click()
      const confirmButton = await browser.$(".modal-footer .btn-primary")
      await confirmButton.waitForExist()
      await confirmButton.click()
      const submitButton = await browser.$("#formBottomSubmit")
      await submitButton.waitForExist()
      await submitButton.click()

      // check if child tasks are inactive
      await ShowTask.openAsAdminUser(TASK_TEST_1_1_UUID)
      let statusField = await browser.$("#status")
      await statusField.waitForExist()
      expect(await statusField.getText()).to.equal("Inactive")

      await ShowTask.openAsAdminUser(TASK_TEST_1_1_1_UUID)
      statusField = await browser.$("#status")
      await statusField.waitForExist()
      expect(await statusField.getText()).to.equal("Inactive")

      await ShowTask.openAsAdminUser(TASK_TEST_1_1_1_1_UUID)
      statusField = await browser.$("#status")
      await statusField.waitForExist()
      expect(await statusField.getText()).to.equal("Inactive")
    })
    it("should not display the modal when the task has no active children", async () => {
      await ShowTask.openAsAdminUser(`${TASK_TEST_1_1_UUID}/edit`)
      // reset it to active first
      const activeButton = await browser.$('label[for="status_ACTIVE"]')
      await activeButton.waitForExist()
      await activeButton.click()
      let submitButton = await browser.$("#formBottomSubmit")
      await submitButton.waitForExist()
      await submitButton.click()
      let statusField = await browser.$("#status")
      await statusField.waitForExist()
      expect(await statusField.getText()).to.equal("Active")

      // now edit to inactive again, but only the selected task should be affected
      await ShowTask.openAsAdminUser(`${TASK_TEST_1_1_UUID}/edit`)
      const inactiveButton = await browser.$('label[for="status_INACTIVE"]')
      await inactiveButton.waitForExist()
      await inactiveButton.click()
      submitButton = await browser.$("#formBottomSubmit")
      await submitButton.waitForExist()
      await submitButton.click()
      statusField = await browser.$("#status")
      await statusField.waitForExist()
      expect(await statusField.getText()).to.equal("Inactive")
    })
  })
})
