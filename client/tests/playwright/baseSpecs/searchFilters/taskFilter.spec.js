import { expect, test } from "@playwright/test"
import TaskFilterPageObject from "../../pages/searchFilters/taskFilter.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, TaskFilter
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    TaskFilter = new TaskFilterPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const NR_OF_ACTIVE_TOP_LEVEL_TASKS = 14
  const NR_OF_TOP_LEVEL_TASKS = NR_OF_ACTIVE_TOP_LEVEL_TASKS + 1
  const INITIAL_NR_OF_ACTIVE_TASKS = 56
  const INITIAL_NR_OF_TASKS = INITIAL_NR_OF_ACTIVE_TASKS + 1
  test.describe("When using the task filter on the reports search", () => {
    test("Should show all active tasks", async () => {
      await TaskFilter.open()
      await TaskFilter.addTaskFilter()
      await TaskFilter.openTaskFilter()
      await expect(await TaskFilter.getTaskRows()).toHaveCount(
        NR_OF_ACTIVE_TOP_LEVEL_TASKS
      )
      await TaskFilter.openAllCollapsedTasks()
      // depending on the test run sequence, more subtasks may have been created
      await expect
        .poll(async () => (await TaskFilter.getTaskRows()).count())
        .toBeGreaterThanOrEqual(INITIAL_NR_OF_ACTIVE_TASKS)
      await expect
        .poll(async () => (await TaskFilter.getTaskRows()).count())
        .toBeLessThanOrEqual(INITIAL_NR_OF_ACTIVE_TASKS + 2)
      await TaskFilter.closeTaskFilter()
    })
    test("Should include the inactive tasks", async () => {
      await TaskFilter.openTaskFilter()
      await TaskFilter.clickInclInactiveCheckbox()
      // wait for contents to be rendered

      await expect(await TaskFilter.getTaskRows()).toHaveCount(
        NR_OF_TOP_LEVEL_TASKS
      )
      await TaskFilter.openAllCollapsedTasks()
      // depending on the test run sequence, more subtasks may have been created
      await expect
        .poll(async () => (await TaskFilter.getTaskRows()).count())
        .toBeGreaterThanOrEqual(INITIAL_NR_OF_TASKS)
      await expect
        .poll(async () => (await TaskFilter.getTaskRows()).count())
        .toBeLessThanOrEqual(INITIAL_NR_OF_TASKS + 2)
      await TaskFilter.clickInclInactiveCheckbox()
      await TaskFilter.closeTaskFilter()
    })
    test("Should show only the filtered tasks", async () => {
      await TaskFilter.openTaskFilter()
      await TaskFilter.searchTasks("Milestone the First in EF 1.1")
      await expect(await TaskFilter.getTaskRows()).toHaveCount(3)
      // the tasks should already load expanded, so it should yield the same result
      await TaskFilter.openAllCollapsedTasks()
      await expect(await TaskFilter.getTaskRows()).toHaveCount(3)
      await TaskFilter.closeTaskFilter()
      await TaskFilter.openTaskFilter()
      await TaskFilter.searchTasks("TAAC")
      await expect(await TaskFilter.getTaskRows()).toHaveCount(1)
      // the only task should now expand, leading to a bigger task count,
      // but expand non-recursively, because another test may have created a subtask for one of them
      await TaskFilter.openFirstLevelCollapsedTasks()
      await expect(await TaskFilter.getTaskRows()).toHaveCount(7)
      await TaskFilter.closeTaskFilter()
    })
  })
})
