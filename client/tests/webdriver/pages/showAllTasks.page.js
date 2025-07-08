import Page from "./page"

const PAGE_URL = "/top-tasks"

class ShowAllTasks extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getTitle() {
    return browser.$("h4.legend")
  }

  async getTree() {
    return browser.$(".bp6-tree")
  }

  async getAllTasks() {
    return (await this.getTree()).$$(".bp6-tree-node-list .bp6-tree-node")
  }

  async getAllDescendants(task, filterVisible = false) {
    const descendants = await task.$$(".bp6-tree-node-list .bp6-tree-node")
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

  async getEventMatrix() {
    return browser.$("#events-matrix")
  }

  async getTasksTableHeader() {
    return browser.$("#tasks-table-header")
  }

  async getTasksTableRows() {
    return browser.$$("#tasks-table-header ~ tr")
  }
}

export default new ShowAllTasks()
