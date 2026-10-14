import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import MergeTasks from "../pages/mergeTasks.page.js"
import ShowTask from "../pages/showTask.page.js"
import { currentPage, test, waitFor } from "../support.js"

const TASK_12B_UUID = "9d3da7f4-8266-47af-b518-995f587250c9"
const TASK_EF1_UUID = "1145e584-4485-4ce0-89c4-2fa2e1fe846a"
const TASK_EF1_2_UUID = "fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0"
const TASK_TEST_1_UUID = "0baf4493-7fd8-423a-8ba3-43e8386d11a7"
const TASK_TEST_1_1_UUID = "33c87d55-9f90-4a23-903a-f7d176444de3"
const TASK_TEST_1_1_1_UUID = "36d8b14c-40b2-4bbe-9d15-9b964381f549"
const TASK_TEST_1_1_1_1_UUID = "c38c7c84-66cc-4978-9cf6-b07d10a50667"
const TASK_12B_ASSIGNED_TASKS = ["1.2.B"]
test.describe("Show task page", () => {
  test.beforeEach("Open the show task page", async () => {
    await ShowTask.openAsAdminUser(TASK_12B_UUID)
  })
  test.describe("When on the show page of a task with assessments", () => {
    test("We should see a table of assessments related to the current task", async () => {
      await waitFor(
        await ShowTask.getAssessmentResults("taskOnceReport", "monthly"),
        "visible"
      )
      const question1AssessmentMonthly = await (
        await ShowTask.getAssessmentResults("taskOnceReport", "monthly")
      )
        .locator("[id*=question1-assessment]")
        .first()
      await pwExpect(question1AssessmentMonthly).not.toHaveCount(0)
    })
  })
  test.describe("When in the show page of a task with a parent task", () => {
    test("We should see a parent task that related to the current task", async () => {
      await waitFor(await ShowTask.getParentTaskField(), "visible")
      await pwExpect(await ShowTask.getParentTaskField()).not.toHaveCount(0)
      await pwExpect(await ShowTask.getParentTask()).toHaveText(
        "EF 1\n»\nEF 1.2",
        {
          useInnerText: true
        }
      )
    })
  })
  test.describe("When in the show page of a task without children tasks", () => {
    test("We should not see list of children tasks", async () => {
      await pwExpect(await ShowTask.getChildrenTasksField()).toHaveCount(0)
    })
  })
  test.describe("When in the show page of a task with a matrix", () => {
    test("Should see sync matrix on the 1.2.B Show page", async () => {
      await ShowTask.openAsAdminUser(TASK_12B_UUID)
      const syncMatrix = await ShowTask.getSyncMatrix()
      await waitFor(syncMatrix, "attached")
      await waitFor(syncMatrix, "visible")
      await pwExpect(await syncMatrix.locator(".legend").first()).toContainText(
        "Sync Matrix for EF 1 » EF 1.2 » 1.2.B",
        {
          useInnerText: true
        }
      )
      const eventSeries = await ShowTask.getEventMatrixEventSeries()
      // Additional eventSeries may have been created during the tests!
      expect(eventSeries).to.have.lengthOf.at.least(1)
      const eventSeriesText = (
        await Promise.all(
          eventSeries.map(async es => (await es.innerText()).trim())
        )
      ).join(" ; ")
      expect(eventSeriesText).to.include("NMI PDT")
      expect(eventSeriesText).to.include("My active NMI test event")
      expect(eventSeriesText).to.include("My inactive NMI test event")
      expect(eventSeriesText).to.include("Inactive event series")
      expect(eventSeriesText).to.include("My active test event")
      expect(eventSeriesText).to.include("My inactive test event")
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(1)
      const taskPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(taskPaths).to.deep.equal(TASK_12B_ASSIGNED_TASKS)

      // Move to the previous period, the inactive eventSeries should no longer be shown
      await ShowTask.gotoPreviousPeriod()
      // Wait for data retrieval
      const eventSeriesPrev = await ShowTask.getEventMatrixEventSeries()
      const eventSeriesPrevText = (
        await Promise.all(
          eventSeriesPrev.map(async es => (await es.innerText()).trim())
        )
      ).join(" ; ")
      expect(eventSeriesPrevText).to.include("NMI PDT")
      expect(eventSeriesPrevText).to.not.include("My active NMI test event")
      expect(eventSeriesPrevText).to.not.include("My inactive NMI test event")
      expect(eventSeriesPrevText).to.not.include("Inactive event series")
      expect(eventSeriesPrevText).to.not.include("My active test event")
      expect(eventSeriesPrevText).to.not.include("My inactive test event")
      const tasksPrev = await ShowTask.getEventMatrixTasks()
      expect(tasksPrev.length).to.equal(1)
      const tasksPrevPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(tasksPrevPaths).to.deep.equal(TASK_12B_ASSIGNED_TASKS)
    })
  })
})
test.describe("Show task page", () => {
  test.beforeEach("Open the show task page", async () => {
    await ShowTask.openAsAdminUser(TASK_EF1_UUID)
  })
  test.describe("When in the show page of a task without a parent task", () => {
    test("We should not see a parent task", async () => {
      await pwExpect(await ShowTask.getParentTaskField()).toHaveCount(0)
    })
  })
  test.describe("When in the show page of a task with children tasks", () => {
    test("We should see list of children tasks that related to the current task", async () => {
      await waitFor(await ShowTask.getChildrenTasks(), "visible")
      await pwExpect(await ShowTask.getChildrenTasksField()).not.toHaveCount(0)
      await pwExpect(await ShowTask.getFirstItemFromChildrenTasks()).toHaveText(
        "1.1",
        {
          useInnerText: true
        }
      )
    })
  })
  test.describe("When in the show page as an admin", () => {
    test("We can select to merge it with another task", async () => {
      await ShowTask.openAsAdminUser(TASK_12B_UUID)
      await (await ShowTask.getMergeButton()).click()
      // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergeTasks.getTitle()).to.exist
      await pwExpect
        .poll(
          async () => await (await MergeTasks.getLeftTaskField()).inputValue()
        )
        .toContain("1.2.B")
      await pwExpect(await MergeTasks.getLeftTaskField()).not.toBeEnabled()
    })
    test("Should open and close the Edit Engagement planning approvals modal correctly", async () => {
      const editButton =
        await ShowTask.getEditEngagementPlanningApprovalsButton()
      await waitFor(editButton, "attached")
      await waitFor(editButton, "visible")
      await editButton.click()
      const modal = await ShowTask.getEditApprovalsModal()
      await waitFor(modal, "attached")
      await waitFor(modal, "visible")
      const modalTitle = await modal.locator(".modal-title").first()
      await pwExpect(modalTitle).toHaveText(
        "Edit Engagement planning approval process",
        {
          useInnerText: true
        }
      )
      const closeButton = await ShowTask.getModalCloseButton()
      await closeButton.click()
      await waitFor(modal, "attached", {
        reverse: true
      })
    })
    test("Should open and close the Edit Report publication approvals modal correctly", async () => {
      const editButton =
        await ShowTask.getEditReportPublicationApprovalsButton()
      await waitFor(editButton, "attached")
      await waitFor(editButton, "visible")
      await editButton.click()
      const modal = await ShowTask.getEditApprovalsModal()
      await waitFor(modal, "attached")
      await waitFor(modal, "visible")
      const modalTitle = await modal.locator(".modal-title").first()
      await pwExpect(modalTitle).toHaveText(
        "Edit Report publication approval process",
        {
          useInnerText: true
        }
      )
      const closeButton = await ShowTask.getModalCloseButton()
      await closeButton.click()
      await waitFor(modal, "attached", {
        reverse: true
      })
    })
  })
})
test.describe("Show task page", () => {
  test.describe("When in the show page of a task with children tasks", () => {
    test("the task's full path should be displayed in the event matrix", async () => {
      // only first task (self) should contain the full path,
      // the remaining ones should contain what comes after the current task
      const EF1_2_MATRIX_TASKS = ["EF 1.2", "»\n1.2.A", "»\n1.2.B", "»\n1.2.C"]
      await ShowTask.openAsAdminUser(TASK_EF1_2_UUID)
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(EF1_2_MATRIX_TASKS.length)
      const containsStarIcon = await Promise.all(
        tasks.map(
          async task =>
            (await (
              await task.locator(".bp6-popover-target img").first()
            ).count()) > 0
        )
      )
      // only first task (self) should contain the task icon
      expect(containsStarIcon).to.deep.equal([true, false, false, false])
      const taskPath = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(taskPath).to.deep.equal(EF1_2_MATRIX_TASKS)
    })
  })
  test.describe("When editing a task and setting it to inactive", () => {
    test("should display a modal with all the affected children tasks to confirm", async () => {
      await ShowTask.openAsAdminUser(`${TASK_TEST_1_UUID}/edit`)
      const inactiveButton = await currentPage()
        .locator('label[for="status_INACTIVE"]')
        .first()
      await waitFor(inactiveButton, "attached")
      await inactiveButton.click()
      const confirmButton = await currentPage()
        .locator(".modal-footer .btn-primary")
        .first()
      await waitFor(confirmButton, "attached")
      await confirmButton.click()
      const submitButton = await currentPage()
        .locator("#formBottomSubmit")
        .first()
      await waitFor(submitButton, "attached")
      await submitButton.click()

      // check if child tasks are inactive
      await ShowTask.openAsAdminUser(TASK_TEST_1_1_UUID)
      let statusField = await currentPage().locator("#status").first()
      await waitFor(statusField, "attached")
      await pwExpect(statusField).toHaveText("Inactive", {
        useInnerText: true
      })
      await ShowTask.openAsAdminUser(TASK_TEST_1_1_1_UUID)
      statusField = await currentPage().locator("#status").first()
      await waitFor(statusField, "attached")
      await pwExpect(statusField).toHaveText("Inactive", {
        useInnerText: true
      })
      await ShowTask.openAsAdminUser(TASK_TEST_1_1_1_1_UUID)
      statusField = await currentPage().locator("#status").first()
      await waitFor(statusField, "attached")
      await pwExpect(statusField).toHaveText("Inactive", {
        useInnerText: true
      })
    })
    test("should not display the modal when the task has no active children", async () => {
      await ShowTask.openAsAdminUser(`${TASK_TEST_1_1_UUID}/edit`)
      // reset it to active first
      const activeButton = await currentPage()
        .locator('label[for="status_ACTIVE"]')
        .first()
      await waitFor(activeButton, "attached")
      await activeButton.click()
      let submitButton = await currentPage()
        .locator("#formBottomSubmit")
        .first()
      await waitFor(submitButton, "attached")
      await submitButton.click()
      let statusField = await currentPage().locator("#status").first()
      await waitFor(statusField, "attached")
      await pwExpect(statusField).toHaveText("Active", {
        useInnerText: true
      })

      // now edit to inactive again, but only the selected task should be affected
      await ShowTask.openAsAdminUser(`${TASK_TEST_1_1_UUID}/edit`)
      const inactiveButton = await currentPage()
        .locator('label[for="status_INACTIVE"]')
        .first()
      await waitFor(inactiveButton, "attached")
      await inactiveButton.click()
      submitButton = await currentPage().locator("#formBottomSubmit").first()
      await waitFor(submitButton, "attached")
      await submitButton.click()
      statusField = await currentPage().locator("#status").first()
      await waitFor(statusField, "attached")
      await pwExpect(statusField).toHaveText("Inactive", {
        useInnerText: true
      })
    })
  })
})
