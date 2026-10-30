import { expect, test } from "@playwright/test"
import ShowAllTasksPageObject from "../pages/showAllTasks.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, ShowAllTasks
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    ShowAllTasks = new ShowAllTasksPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const FIRST_TASK_NAME = "EF 1 | Budget and Planning"
  const FIRST_TASK_DESCENDANT_NAME = "1.1 | Budgeting in the MoD"
  const NO_DESCENDANTS_TASK_NAME = "EF 5 | Force Sustainment (Logistics)"
  const NR_OF_ACTIVE_TOP_LEVEL_TASKS = 14
  test.describe("Show All Tasks Page", () => {
    test.beforeEach(async () => {
      await ShowAllTasks.open()
      await (
        await ShowAllTasks.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (
        await ShowAllTasks.getTree()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should display all top tasks", async () => {
      const topTasks = await ShowAllTasks.getAllTasks()
      await expect(topTasks).toHaveCount(NR_OF_ACTIVE_TOP_LEVEL_TASKS)
      for (const task of await topTasks.all()) {
        await expect(task).toBeVisible()
      }
    })
    test("Should expand a task to show its descendants", async () => {
      const topTasks = await ShowAllTasks.getAllTasks()
      const firstTask = topTasks.nth(1)
      await expect(firstTask).toHaveText(FIRST_TASK_NAME, {
        useInnerText: true
      })
      const caret = await firstTask.locator(".bp6-tree-node-caret").first()
      await expect(caret).toBeVisible()
      await caret.click()
      // wait for tree animation to finish

      const descendants = await ShowAllTasks.getAllDescendants(firstTask)
      await expect(descendants).toHaveCount(3)
      const firstDescendant = descendants.first()
      await expect(firstDescendant).toBeVisible()
      await expect(firstDescendant).toHaveText(FIRST_TASK_DESCENDANT_NAME, {
        useInnerText: true
      })
    })
    test("Should collapse a task to hide its descendants", async () => {
      const topTasks = await ShowAllTasks.getAllTasks()
      const firstTask = topTasks.nth(1)
      const caret = await firstTask.locator(".bp6-tree-node-caret").first()
      await expect(caret).toBeVisible()
      await caret.click()
      // wait for tree animation to finish

      const descendants = await ShowAllTasks.getAllDescendants(firstTask)
      await expect(descendants).toHaveCount(3)
      const firstDescendant = descendants.first()
      await expect(firstDescendant).toBeVisible()
      await caret.click()
      await firstDescendant.waitFor({
        state: "detached",
        timeout: 3000
      })
      const collapsedDescendants =
        await ShowAllTasks.getAllDescendants(firstTask)
      await expect(collapsedDescendants).toHaveCount(0)
    })
    test("Should not show a caret for tasks without descendants", async () => {
      const topTasks = await ShowAllTasks.getAllTasks()
      const noDescendantsTask = topTasks.nth(5)
      await expect(noDescendantsTask).toHaveText(NO_DESCENDANTS_TASK_NAME, {
        useInnerText: true
      })
      const caret = await noDescendantsTask
        .locator(".bp6-tree-node-caret")
        .first()
      await expect(caret).toHaveCount(0)
      const descendants =
        await ShowAllTasks.getAllDescendants(noDescendantsTask)
      await expect(
        descendants,
        "No descendants should be present for EF 5"
      ).toHaveCount(0)
    })
  })
})
