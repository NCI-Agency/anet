import { expect, test } from "@playwright/test"
import MergeTasksPageObject from "../pages/mergeTasks.page.js"
import ShowTaskPageObject from "../pages/showTask.page.js"

test.describe(() => {
  let page, MergeTasks, ShowTask
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    MergeTasks = new MergeTasksPageObject(page)
    ShowTask = new ShowTaskPageObject(page)
  })
  const TASK_12B_UUID = "9d3da7f4-8266-47af-b518-995f587250c9"
  const TASK_EF1_UUID = "1145e584-4485-4ce0-89c4-2fa2e1fe846a"
  const TASK_EF1_2_UUID = "fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0"
  const TASK_TEST_1_UUID = "0baf4493-7fd8-423a-8ba3-43e8386d11a7"
  const TASK_TEST_1_1_UUID = "33c87d55-9f90-4a23-903a-f7d176444de3"
  const TASK_TEST_1_1_1_UUID = "36d8b14c-40b2-4bbe-9d15-9b964381f549"
  const TASK_TEST_1_1_1_1_UUID = "c38c7c84-66cc-4978-9cf6-b07d10a50667"
  const TASK_12B_ASSIGNED_TASKS = ["1.2.B"]
  test("Show task page for a child task", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 4)

    const beforeStep1 = async () => {
      await ShowTask.openAsAdminUser(TASK_12B_UUID)
    }
    await test.step("When on the show page of a task with assessments", async () => {
      await test.step(
        "We should see a table of assessments related to the current task",
        async () => {
          await test.step("Open the show task page", beforeStep1)

          await (
            await ShowTask.getAssessmentResults("taskOnceReport", "monthly")
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          const question1AssessmentMonthly = await (
            await ShowTask.getAssessmentResults("taskOnceReport", "monthly")
          )
            .locator("[id*=question1-assessment]")
            .first()
          await expect(question1AssessmentMonthly).not.toHaveCount(0)
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When in the show page of a task with a parent task", async () => {
      await test.step(
        "We should see a parent task that related to the current task",
        async () => {
          await test.step("Open the show task page", beforeStep1)

          await (
            await ShowTask.getParentTaskField()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(await ShowTask.getParentTaskField()).not.toHaveCount(0)
          await expect(await ShowTask.getParentTask()).toHaveText(
            "EF 1\n»\nEF 1.2",
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When in the show page of a task without children tasks", async () => {
      await test.step(
        "We should not see list of children tasks",
        async () => {
          await test.step("Open the show task page", beforeStep1)

          await expect(await ShowTask.getChildrenTasksField()).toHaveCount(0)
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When in the show page of a task with a matrix", async () => {
      await test.step(
        "Should see sync matrix on the 1.2.B Show page",
        async () => {
          await test.step("Open the show task page", beforeStep1)

          await ShowTask.openAsAdminUser(TASK_12B_UUID)
          const syncMatrix = await ShowTask.getSyncMatrix()
          await syncMatrix.waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(
            await syncMatrix.locator(".legend").first()
          ).toContainText("Sync Matrix for EF 1 » EF 1.2 » 1.2.B", {
            useInnerText: true
          })
          const eventSeries = await ShowTask.getEventMatrixEventSeries()
          // Additional eventSeries may have been created during the tests!
          expect(eventSeries.length).toBeGreaterThanOrEqual(1)
          const eventSeriesText = (
            await Promise.all(
              eventSeries.map(async es => (await es.innerText()).trim())
            )
          ).join(" ; ")
          expect(eventSeriesText).toContain("NMI PDT")
          expect(eventSeriesText).toContain("My active NMI test event")
          expect(eventSeriesText).toContain("My inactive NMI test event")
          expect(eventSeriesText).toContain("Inactive event series")
          expect(eventSeriesText).toContain("My active test event")
          expect(eventSeriesText).toContain("My inactive test event")
          const tasks = await ShowTask.getEventMatrixTasks()
          expect(tasks.length).toBe(1)
          const taskPaths = await Promise.all(
            tasks.map(async task =>
              (
                await (await task.locator("td:first-child").first()).innerText()
              ).trim()
            )
          )
          expect(taskPaths).toEqual(TASK_12B_ASSIGNED_TASKS)

          // Move to the previous period, the inactive eventSeries should no longer be shown
          await ShowTask.gotoPreviousPeriod()
          // Wait for data retrieval
          const eventSeriesPrev = await ShowTask.getEventMatrixEventSeries()
          const eventSeriesPrevText = (
            await Promise.all(
              eventSeriesPrev.map(async es => (await es.innerText()).trim())
            )
          ).join(" ; ")
          expect(eventSeriesPrevText).toContain("NMI PDT")
          expect(eventSeriesPrevText).not.toContain("My active NMI test event")
          expect(eventSeriesPrevText).not.toContain(
            "My inactive NMI test event"
          )
          expect(eventSeriesPrevText).not.toContain("Inactive event series")
          expect(eventSeriesPrevText).not.toContain("My active test event")
          expect(eventSeriesPrevText).not.toContain("My inactive test event")
          const tasksPrev = await ShowTask.getEventMatrixTasks()
          expect(tasksPrev.length).toBe(1)
          const tasksPrevPaths = await Promise.all(
            tasks.map(async task =>
              (
                await (await task.locator("td:first-child").first()).innerText()
              ).trim()
            )
          )
          expect(tasksPrevPaths).toEqual(TASK_12B_ASSIGNED_TASKS)
        },
        { timeout: stepTimeout }
      )
    })
  })
  test("Show task page for a top-level task", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 5)

    const beforeStep2 = async () => {
      await ShowTask.openAsAdminUser(TASK_EF1_UUID)
    }
    await test.step("When in the show page of a task without a parent task", async () => {
      await test.step(
        "We should not see a parent task",
        async () => {
          await test.step("Open the show task page", beforeStep2)

          await expect(await ShowTask.getParentTaskField()).toHaveCount(0)
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When in the show page of a task with children tasks", async () => {
      await test.step(
        "We should see list of children tasks that related to the current task",
        async () => {
          await test.step("Open the show task page", beforeStep2)

          await (
            await ShowTask.getChildrenTasks()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(await ShowTask.getChildrenTasksField()).not.toHaveCount(
            0
          )
          await expect(
            await ShowTask.getFirstItemFromChildrenTasks()
          ).toHaveText("1.1", {
            useInnerText: true
          })
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When in the show page as an admin", async () => {
      await test.step(
        "We can select to merge it with another task",
        async () => {
          await test.step("Open the show task page", beforeStep2)

          await ShowTask.openAsAdminUser(TASK_12B_UUID)
          await (await ShowTask.getMergeButton()).click()
          // wait for the merge page to render and load data
          await expect(await MergeTasks.getTitle()).toBeVisible()
          await expect(await MergeTasks.getLeftTaskField()).toHaveValue(
            /1\.2\.B/
          )
          await expect(await MergeTasks.getLeftTaskField()).not.toBeEnabled()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should open and close the Edit Engagement planning approvals modal correctly",
        async () => {
          await test.step("Open the show task page", beforeStep2)

          const editButton =
            await ShowTask.getEditEngagementPlanningApprovalsButton()
          await editButton.click()
          const modal = await ShowTask.getEditApprovalsModal()
          await modal.waitFor({
            state: "visible",
            timeout: 10000
          })
          const modalTitle = await modal.locator(".modal-title").first()
          await expect(modalTitle).toHaveText(
            "Edit Engagement planning approval process",
            {
              useInnerText: true
            }
          )
          const closeButton = await ShowTask.getModalCloseButton()
          await closeButton.click()
          await modal.waitFor({
            state: "detached",
            timeout: 10000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should open and close the Edit Report publication approvals modal correctly",
        async () => {
          await test.step("Open the show task page", beforeStep2)

          const editButton =
            await ShowTask.getEditReportPublicationApprovalsButton()
          await editButton.click()
          const modal = await ShowTask.getEditApprovalsModal()
          await modal.waitFor({
            state: "visible",
            timeout: 10000
          })
          const modalTitle = await modal.locator(".modal-title").first()
          await expect(modalTitle).toHaveText(
            "Edit Report publication approval process",
            {
              useInnerText: true
            }
          )
          const closeButton = await ShowTask.getModalCloseButton()
          await closeButton.click()
          await modal.waitFor({
            state: "detached",
            timeout: 10000
          })
        },
        { timeout: stepTimeout }
      )
    })
  })
  test("Show task page matrix and inactive children", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 3)

    await test.step("When in the show page of a task with children tasks", async () => {
      await test.step(
        "the task's full path should be displayed in the event matrix",
        async () => {
          // only first task (self) should contain the full path,
          // the remaining ones should contain what comes after the current task
          const EF1_2_MATRIX_TASKS = [
            "EF 1.2",
            "»\n1.2.A",
            "»\n1.2.B",
            "»\n1.2.C"
          ]
          await ShowTask.openAsAdminUser(TASK_EF1_2_UUID)
          const tasks = await ShowTask.getEventMatrixTasks()
          expect(tasks.length).toBe(EF1_2_MATRIX_TASKS.length)
          const containsStarIcon = await Promise.all(
            tasks.map(
              async task =>
                (await (
                  await task.locator(".bp6-popover-target img").first()
                ).count()) > 0
            )
          )
          // only first task (self) should contain the task icon
          expect(containsStarIcon).toEqual([true, false, false, false])
          const taskPath = await Promise.all(
            tasks.map(async task =>
              (
                await (await task.locator("td:first-child").first()).innerText()
              ).trim()
            )
          )
          expect(taskPath).toEqual(EF1_2_MATRIX_TASKS)
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When editing a task and setting it to inactive", async () => {
      await test.step(
        "should display a modal with all the affected children tasks to confirm",
        async () => {
          await ShowTask.openAsAdminUser(`${TASK_TEST_1_UUID}/edit`)
          const inactiveButton = await page
            .locator('label[for="status_INACTIVE"]')
            .first()
          await inactiveButton.click()
          const confirmButton = await page
            .locator(".modal-footer .btn-primary")
            .first()
          await confirmButton.click()
          const submitButton = await page.locator("#formBottomSubmit").first()
          await submitButton.click()

          // check if child tasks are inactive
          await ShowTask.openAsAdminUser(TASK_TEST_1_1_UUID)
          let statusField = await page.locator("#status").first()
          await expect(statusField).toHaveText("Inactive", {
            useInnerText: true
          })
          await ShowTask.openAsAdminUser(TASK_TEST_1_1_1_UUID)
          statusField = await page.locator("#status").first()
          await expect(statusField).toHaveText("Inactive", {
            useInnerText: true
          })
          await ShowTask.openAsAdminUser(TASK_TEST_1_1_1_1_UUID)
          statusField = await page.locator("#status").first()
          await expect(statusField).toHaveText("Inactive", {
            useInnerText: true
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "should not display the modal when the task has no active children",
        async () => {
          await ShowTask.openAsAdminUser(`${TASK_TEST_1_1_UUID}/edit`)
          // reset it to active first
          const activeButton = await page
            .locator('label[for="status_ACTIVE"]')
            .first()
          await activeButton.click()
          let submitButton = await page.locator("#formBottomSubmit").first()
          await submitButton.click()
          let statusField = await page.locator("#status").first()
          await expect(statusField).toHaveText("Active", {
            useInnerText: true
          })

          // now edit to inactive again, but only the selected task should be affected
          await ShowTask.openAsAdminUser(`${TASK_TEST_1_1_UUID}/edit`)
          const inactiveButton = await page
            .locator('label[for="status_INACTIVE"]')
            .first()
          await inactiveButton.click()
          submitButton = await page.locator("#formBottomSubmit").first()
          await submitButton.click()
          statusField = await page.locator("#status").first()
          await expect(statusField).toHaveText("Inactive", {
            useInnerText: true
          })
        },
        { timeout: stepTimeout }
      )
    })
  })
})
