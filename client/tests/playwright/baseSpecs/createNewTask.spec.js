import { expect, test } from "@playwright/test"
import CreateTaskPageObject from "../pages/createNewTask.page.js"
import ShowTaskPageObject from "../pages/showTask.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, CreateTask, ShowTask
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    CreateTask = new CreateTaskPageObject(page)
    ShowTask = new ShowTaskPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
})
