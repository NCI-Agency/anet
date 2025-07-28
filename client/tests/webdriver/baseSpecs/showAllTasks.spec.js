import { expect } from "chai"
import ShowAllTasks from "../pages/showAllTasks.page"

const FIRST_TASK_NAME = "EF 1 | Budget and Planning"
const FIRST_TASK_DESCENDANT_NAME = "1.1 | Budgeting in the MoD"
const NO_DESCENDANTS_TASK_NAME = "EF 5 | Force Sustainment (Logistics)"

describe("Show All Tasks Page", () => {
  beforeEach(async () => {
    await ShowAllTasks.open()
    await (await ShowAllTasks.getTitle()).waitForDisplayed()
    await (await ShowAllTasks.getTree()).waitForDisplayed()
  })

  it("Should display all top tasks", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    expect(topTasks).to.have.lengthOf(13)
    for (const task of topTasks) {
      expect(await task.isDisplayed()).to.equal(true)
    }
  })

  it("Should expand a task to show its descendants", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    const firstTask = topTasks[1]
    const firstTaskText = await firstTask.getText()
    expect(firstTaskText).to.equal(FIRST_TASK_NAME)

    const caret = await firstTask.$(".bp6-tree-node-caret")
    // eslint-disable-next-line no-unused-expressions
    expect(caret).to.exist
    await caret.click()
    await browser.pause(300) // wait for tree animation to finish

    const descendants = await ShowAllTasks.getAllDescendants(firstTask)
    expect(descendants).to.have.lengthOf(3)
    const firstDescendant = descendants[0]
    expect(await firstDescendant.isDisplayed()).to.equal(true)
    const firstDescendantText = await firstDescendant.getText()
    expect(firstDescendantText).to.equal(FIRST_TASK_DESCENDANT_NAME)
  })

  it("Should collapse a task to hide its descendants", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    const firstTask = topTasks[1]

    const caret = await firstTask.$(".bp6-tree-node-caret")
    // eslint-disable-next-line no-unused-expressions
    expect(caret).to.exist
    await caret.click()
    await browser.pause(300) // wait for tree animation to finish

    const descendants = await ShowAllTasks.getAllDescendants(firstTask)
    expect(descendants).to.have.lengthOf(3)
    const firstDescendant = descendants[0]
    expect(await firstDescendant.isDisplayed()).to.equal(true)

    await caret.click()
    await firstDescendant.waitForExist({ reverse: true, timeout: 3000 })
    const collapsedDescendants = await ShowAllTasks.getAllDescendants(firstTask)
    expect(collapsedDescendants).to.have.lengthOf(0)
  })

  it("Should not show a caret for tasks without descendants", async () => {
    const topTasks = await ShowAllTasks.getAllTasks()
    const noDescendantsTask = topTasks[5]

    const noDescendantsTaskText = await noDescendantsTask.getText()
    expect(noDescendantsTaskText).to.equal(NO_DESCENDANTS_TASK_NAME)

    const caret = await noDescendantsTask.$(".bp6-tree-node-caret")
    const caretExists = await caret.isExisting()
    expect(caretExists).to.equal(false)

    const descendants = await ShowAllTasks.getAllDescendants(noDescendantsTask)
    expect(descendants).to.have.lengthOf(
      0,
      "No descendants should be present for EF 5"
    )
  })

  it("Should show the event matrix for all tasks", async () => {
    const eventMatrix = await ShowAllTasks.getEventMatrix()
    await eventMatrix.waitForExist()
    await eventMatrix.waitForDisplayed()
    const tasksTableHeader = await ShowAllTasks.getTasksTableHeader()
    await tasksTableHeader.waitForExist()
    await tasksTableHeader.waitForDisplayed()

    const topTasks = await ShowAllTasks.getAllTasks()
    const tasksTableRows = await ShowAllTasks.getTasksTableRows()
    // Assert that we have at least a sensible number of rows
    expect(tasksTableRows.length).to.be.at.least(topTasks.length)

    const containsStarIcon = await tasksTableRows.map(
      async task => await task.$("img").isExisting()
    )
    // Assert that all the tasks have a star, displaying the full path
    // eslint-disable-next-line no-unused-expressions
    expect(containsStarIcon.every(Boolean)).to.be.true
  })
})
