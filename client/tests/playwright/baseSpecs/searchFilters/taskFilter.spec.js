import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import TaskFilter from "../../pages/searchFilters/taskFilter.page.js"
import { test } from "../../support.js"

const NR_OF_ACTIVE_TOP_LEVEL_TASKS = 14
const NR_OF_TOP_LEVEL_TASKS = NR_OF_ACTIVE_TOP_LEVEL_TASKS + 1
const INITIAL_NR_OF_ACTIVE_TASKS = 56
const INITIAL_NR_OF_TASKS = INITIAL_NR_OF_ACTIVE_TASKS + 1
test.describe("When using the task filter on the reports search", () => {
  test("Should show all active tasks", async () => {
    await TaskFilter.open()
    await TaskFilter.addTaskFilter()
    await TaskFilter.openTaskFilter()
    await pwExpect
      .poll(async () => await TaskFilter.getTaskCount())
      .toEqual(NR_OF_ACTIVE_TOP_LEVEL_TASKS)
    await TaskFilter.openAllCollapsedTasks()
    // depending on the test run sequence, more subtasks may have been created
    expect(await TaskFilter.getTaskCount()).to.be.within(
      INITIAL_NR_OF_ACTIVE_TASKS,
      INITIAL_NR_OF_ACTIVE_TASKS + 2
    )
    await TaskFilter.closeTaskFilter()
  })
  test("Should include the inactive tasks", async () => {
    await TaskFilter.openTaskFilter()
    await TaskFilter.clickInclInactiveCheckbox()
    // wait for contents to be rendered

    await pwExpect
      .poll(async () => await TaskFilter.getTaskCount())
      .toEqual(NR_OF_TOP_LEVEL_TASKS)
    await TaskFilter.openAllCollapsedTasks()
    // depending on the test run sequence, more subtasks may have been created
    expect(await TaskFilter.getTaskCount()).to.be.within(
      INITIAL_NR_OF_TASKS,
      INITIAL_NR_OF_TASKS + 2
    )
    await TaskFilter.clickInclInactiveCheckbox()
    await TaskFilter.closeTaskFilter()
  })
  test("Should show only the filtered tasks", async () => {
    await TaskFilter.openTaskFilter()
    await TaskFilter.searchTasks("Milestone the First in EF 1.1")
    await pwExpect.poll(async () => await TaskFilter.getTaskCount()).toEqual(3)
    // the tasks should already load expanded, so it should yield the same result
    await TaskFilter.openAllCollapsedTasks()
    await pwExpect.poll(async () => await TaskFilter.getTaskCount()).toEqual(3)
    await TaskFilter.closeTaskFilter()
    await TaskFilter.openTaskFilter()
    await TaskFilter.searchTasks("TAAC")
    await pwExpect.poll(async () => await TaskFilter.getTaskCount()).toEqual(1)
    // the only task should now expand, leading to a bigger task count,
    // but expand non-recursively, because another test may have created a subtask for one of them
    await TaskFilter.openFirstLevelCollapsedTasks()
    await pwExpect.poll(async () => await TaskFilter.getTaskCount()).toEqual(7)
    await TaskFilter.closeTaskFilter()
  })
})
