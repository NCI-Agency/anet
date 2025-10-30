import { expect } from "chai"
import TaskFilter from "../../pages/searchFilters/taskFilter.page"

const NR_OF_ACTIVE_TOP_LEVEL_TASKS = 14
const NR_OF_TOP_LEVEL_TASKS = NR_OF_ACTIVE_TOP_LEVEL_TASKS + 1
const INITIAL_NR_OF_ACTIVE_TASKS = 56
const INITIAL_NR_OF_TASKS = INITIAL_NR_OF_ACTIVE_TASKS + 1

describe("When using the task filter on the reports search", () => {
  it("Should show all active tasks", async () => {
    await TaskFilter.open()
    await TaskFilter.addTaskFilter()
    await TaskFilter.openTaskFilter()

    expect(await TaskFilter.getTaskCount()).to.equal(
      NR_OF_ACTIVE_TOP_LEVEL_TASKS
    )

    await TaskFilter.openAllCollapsedTasks()
    // depending on the test run sequence, more subtasks may have been created
    expect(await TaskFilter.getTaskCount()).to.be.within(
      INITIAL_NR_OF_ACTIVE_TASKS,
      INITIAL_NR_OF_ACTIVE_TASKS + 2
    )

    await TaskFilter.closeTaskFilter()
  })

  it("Should include the inactive tasks", async () => {
    await TaskFilter.openTaskFilter()
    await TaskFilter.clickInclInactiveCheckbox()
    await browser.pause(500) // wait for contents to be rendered

    expect(await TaskFilter.getTaskCount()).to.equal(NR_OF_TOP_LEVEL_TASKS)

    await TaskFilter.openAllCollapsedTasks()
    // depending on the test run sequence, more subtasks may have been created
    expect(await TaskFilter.getTaskCount()).to.be.within(
      INITIAL_NR_OF_TASKS,
      INITIAL_NR_OF_TASKS + 2
    )

    await TaskFilter.clickInclInactiveCheckbox()
    await TaskFilter.closeTaskFilter()
  })

  it("Should show only the filtered tasks", async () => {
    await TaskFilter.openTaskFilter()
    await TaskFilter.searchTasks("Milestone the First in EF 1.1")
    expect(await TaskFilter.getTaskCount()).to.equal(3)
    // the tasks should already load expanded, so it should yield the same result
    await TaskFilter.openAllCollapsedTasks()
    expect(await TaskFilter.getTaskCount()).to.equal(3)
    await TaskFilter.closeTaskFilter()

    await TaskFilter.openTaskFilter()
    await TaskFilter.searchTasks("TAAC")
    expect(await TaskFilter.getTaskCount()).to.equal(1)
    // the only task should now expand, leading to a bigger task count,
    // but expand non-recursively, because another test may have created a subtask for one of them
    await TaskFilter.openFirstLevelCollapsedTasks()
    expect(await TaskFilter.getTaskCount()).to.equal(7)
    await TaskFilter.closeTaskFilter()
  })
})
