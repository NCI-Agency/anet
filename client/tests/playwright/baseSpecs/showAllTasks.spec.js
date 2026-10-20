import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import ShowAllTasks from "../pages/showAllTasks.page.js"
import { test, waitFor } from "../support.js"

const FIRST_TASK_NAME = "EF 1 | Budget and Planning"
const FIRST_TASK_DESCENDANT_NAME = "1.1 | Budgeting in the MoD"
const NO_DESCENDANTS_TASK_NAME = "EF 5 | Force Sustainment (Logistics)"
const NR_OF_ACTIVE_TOP_LEVEL_TASKS = 14
test.describe("Show All Tasks Page", () => {
  test.beforeEach(async () => {
    await ShowAllTasks.open()
    await waitFor(await ShowAllTasks.getTitle(), "visible")
    await waitFor(await ShowAllTasks.getTree(), "visible")
  })
  test("Should display all top tasks", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    expect(topTasks).to.have.lengthOf(NR_OF_ACTIVE_TOP_LEVEL_TASKS)
    for (const task of topTasks) {
      await pwExpect(task).toBeVisible()
    }
  })
  test("Should expand a task to show its descendants", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    const firstTask = topTasks[1]
    const firstTaskText = (await firstTask.innerText()).trim()
    expect(firstTaskText).to.equal(FIRST_TASK_NAME)
    const caret = await firstTask.locator(".bp6-tree-node-caret").first()
    // eslint-disable-next-line no-unused-expressions
    expect(caret).to.exist
    await caret.click()
    // wait for tree animation to finish

    const descendants = await ShowAllTasks.getAllDescendants(firstTask)
    expect(descendants).to.have.lengthOf(3)
    const firstDescendant = descendants[0]
    await pwExpect(firstDescendant).toBeVisible()
    const firstDescendantText = (await firstDescendant.innerText()).trim()
    expect(firstDescendantText).to.equal(FIRST_TASK_DESCENDANT_NAME)
  })
  test("Should collapse a task to hide its descendants", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    const firstTask = topTasks[1]
    const caret = await firstTask.locator(".bp6-tree-node-caret").first()
    // eslint-disable-next-line no-unused-expressions
    expect(caret).to.exist
    await caret.click()
    // wait for tree animation to finish

    const descendants = await ShowAllTasks.getAllDescendants(firstTask)
    expect(descendants).to.have.lengthOf(3)
    const firstDescendant = descendants[0]
    await pwExpect(firstDescendant).toBeVisible()
    await caret.click()
    await waitFor(firstDescendant, "attached", {
      reverse: true,
      timeout: 3000
    })
    const collapsedDescendants = await ShowAllTasks.getAllDescendants(firstTask)
    expect(collapsedDescendants).to.have.lengthOf(0)
  })
  test("Should not show a caret for tasks without descendants", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    const noDescendantsTask = topTasks[5]
    const noDescendantsTaskText = (await noDescendantsTask.innerText()).trim()
    expect(noDescendantsTaskText).to.equal(NO_DESCENDANTS_TASK_NAME)
    const caret = await noDescendantsTask
      .locator(".bp6-tree-node-caret")
      .first()
    const caretExists = (await caret.count()) > 0
    expect(caretExists).to.equal(false)
    const descendants = await ShowAllTasks.getAllDescendants(noDescendantsTask)
    expect(descendants).to.have.lengthOf(
      0,
      "No descendants should be present for EF 5"
    )
  })
})
