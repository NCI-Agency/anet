import { expect, test } from "@playwright/test"
import CreateTaskPageObject from "../pages/createNewTask.page.js"
import ShowTaskPageObject from "../pages/showTask.page.js"

test.describe(() => {
  let CreateTask, ShowTask
  test.beforeEach(async ({ page }) => {
    CreateTask = new CreateTaskPageObject(page)
    ShowTask = new ShowTaskPageObject(page)
  })
  const SHORT_NAME = "TO 1"
  const LONG_NAME = "To the 1"
  const PARENT_TASK = "TAAC Air"
  const DESCRIPTION = "Test Task 1"
  const SHORT_NAME_SUBTASK = "TO 1.1"
  const LONG_NAME_SUBTASK = "To the 1.1"
  const DESCRIPTION_SUBTASK = "Test Task 1.1"
  test("When creating an task", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 5)

    await test.step(
      "Should show name to be required when submitting empty form",
      async () => {
        await CreateTask.openAsAdmin()
        await (
          await CreateTask.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await CreateTask.submitForm()
        await (
          await CreateTask.getShortName()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should successfully create a task",
      async () => {
        await (await CreateTask.getShortNameInput()).fill(String(SHORT_NAME))
        await (await CreateTask.getLongNameInput()).fill(String(LONG_NAME))
        await CreateTask.selectParentTaskByText(PARENT_TASK)
        await CreateTask.fillTaskDescription(DESCRIPTION)
        await CreateTask.submitForm()
        await ShowTask.waitForAlertSuccessToLoad()
        await expect(await ShowTask.getAlertSuccess()).toHaveText(
          "Objective saved",
          {
            useInnerText: true
          }
        )
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should display the newly created task",
      async () => {
        await expect(await ShowTask.getShortName()).toHaveText(
          `Objective ${SHORT_NAME}`,
          {
            useInnerText: true
          }
        )
        await expect(await ShowTask.getLongName()).toHaveText(LONG_NAME, {
          useInnerText: true
        })
        await expect(await ShowTask.getDescription()).toHaveText(DESCRIPTION, {
          useInnerText: true
        })
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should be able to create a sub-task for the newly created task",
      async () => {
        await (await ShowTask.getCreateSubTaskButton()).click()
        await (
          await CreateTask.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await CreateTask.getParentTaskInput()).toHaveValue(
          SHORT_NAME
        )
        await (
          await CreateTask.getShortNameInput()
        ).fill(String(SHORT_NAME_SUBTASK))
        await (
          await CreateTask.getLongNameInput()
        ).fill(String(LONG_NAME_SUBTASK))
        await CreateTask.fillTaskDescription(DESCRIPTION_SUBTASK)
        await CreateTask.submitForm()
        await ShowTask.waitForAlertSuccessToLoad()
        await expect(await ShowTask.getAlertSuccess()).toHaveText(
          "Objective saved",
          {
            useInnerText: true
          }
        )
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should display the newly created sub-task",
      async () => {
        await expect(await ShowTask.getShortName()).toHaveText(
          `Objective ${SHORT_NAME_SUBTASK}`,
          {
            useInnerText: true
          }
        )
        await expect(await ShowTask.getLongName()).toHaveText(
          LONG_NAME_SUBTASK,
          {
            useInnerText: true
          }
        )
        await expect(await ShowTask.getDescription()).toContainText(
          DESCRIPTION_SUBTASK,
          {
            useInnerText: true
          }
        )
      },
      { timeout: stepTimeout }
    )
  })
})
