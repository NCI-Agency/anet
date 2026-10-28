import { expect } from "@playwright/test"
import CreateTask from "../pages/createNewTask.page.js"
import ShowTask from "../pages/showTask.page.js"
import { test, waitFor } from "../support.js"

const SHORT_NAME = "TO 1"
const LONG_NAME = "To the 1"
const PARENT_TASK = "TAAC Air"
const DESCRIPTION = "Test Task 1"
const SHORT_NAME_SUBTASK = "TO 1.1"
const LONG_NAME_SUBTASK = "To the 1.1"
const DESCRIPTION_SUBTASK = "Test Task 1.1"
test.describe("When creating an task", () => {
  test("Should show name to be required when submitting empty form", async () => {
    await CreateTask.openAsAdmin()
    await waitFor(await CreateTask.getForm(), "visible")
    await CreateTask.submitForm()
    await waitFor(await CreateTask.getShortName(), "visible")
  })
  test("Should successfully create a task", async () => {
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
  })
  test("Should display the newly created task", async () => {
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
  })
  test("Should be able to create a sub-task for the newly created task", async () => {
    await (await ShowTask.getCreateSubTaskButton()).click()
    await waitFor(await CreateTask.getForm(), "visible")
    await expect(await CreateTask.getParentTaskInput()).toHaveValue(SHORT_NAME)
    await (
      await CreateTask.getShortNameInput()
    ).fill(String(SHORT_NAME_SUBTASK))
    await (await CreateTask.getLongNameInput()).fill(String(LONG_NAME_SUBTASK))
    await CreateTask.fillTaskDescription(DESCRIPTION_SUBTASK)
    await CreateTask.submitForm()
    await ShowTask.waitForAlertSuccessToLoad()
    await expect(await ShowTask.getAlertSuccess()).toHaveText(
      "Objective saved",
      {
        useInnerText: true
      }
    )
  })
  test("Should display the newly created sub-task", async () => {
    await expect(await ShowTask.getShortName()).toHaveText(
      `Objective ${SHORT_NAME_SUBTASK}`,
      {
        useInnerText: true
      }
    )
    await expect(await ShowTask.getLongName()).toHaveText(LONG_NAME_SUBTASK, {
      useInnerText: true
    })
    await expect(await ShowTask.getDescription()).toContainText(
      DESCRIPTION_SUBTASK,
      {
        useInnerText: true
      }
    )
  })
})
