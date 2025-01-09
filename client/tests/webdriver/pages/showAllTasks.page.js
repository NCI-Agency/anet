import Page from "./page"

const PAGE_URL = "/top-tasks"
const TIMEOUT = 5000

class ShowAllTasks extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getAllTasks() {
    await browser.pause(TIMEOUT)
    return await browser.$$(".bp5-tree-node")
  }

  async getAllDescendants(task, filterVisible = false) {
    await browser.pause(TIMEOUT)
    const descendants = await task.$$(".bp5-tree-node-list .bp5-tree-node")
    if (!filterVisible) {
      return descendants
    }
    const visibleDescendants = []
    for (const descendant of descendants) {
      if (await descendant.isDisplayed()) {
        visibleDescendants.push(descendant)
      }
    }
    return visibleDescendants
  }
}

export default new ShowAllTasks()
