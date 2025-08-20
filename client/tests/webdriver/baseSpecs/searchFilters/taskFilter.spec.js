import { expect } from "chai"
import TaskFilter from "../../pages/searchFilters/taskFilter.page"

describe("When using the task filter on the reports search", () => {
  it("Should show all the tasks", async () => {
    await TaskFilter.open()
    await TaskFilter.openTaskFilter()

    expect(await TaskFilter.getTaskCount()).to.equal(13)

    await TaskFilter.openAllCollapsedTasks()
    // depending on the test run sequence, one more task may have been created
    expect(await TaskFilter.getTaskCount()).to.be.oneOf([52, 53, 54])
  })

  it("Should show only the filtered tasks", async () => {
    await TaskFilter.searchTasks("Milestone the First in EF 1.1")
    expect(await TaskFilter.getTaskCount()).to.equal(3)
    // the tasks should already load expanded, so it should yield the same result
    await TaskFilter.openAllCollapsedTasks()
    expect(await TaskFilter.getTaskCount()).to.equal(3)
    await TaskFilter.closeTaskFilter()

    await TaskFilter.searchTasks("TAAC")
    expect(await TaskFilter.getTaskCount()).to.equal(1)
    // the only task should now expand, leading to a bigger task count,
    // but expand non-recursively, because another test may have created a subtask for one of them
    await TaskFilter.openAllCollapsedTasks(true)
    expect(await TaskFilter.getTaskCount()).to.equal(7)
    await TaskFilter.closeTaskFilter()
  })
})
