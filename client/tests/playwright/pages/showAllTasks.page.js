import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/top-tasks"
class ShowAllTasks extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getTitle() {
    return currentPage().locator("h4.legend").first()
  }

  async getTree() {
    return currentPage().locator(".bp6-tree").first()
  }

  async getAllTasks() {
    return (await this.getTree())
      .locator(".bp6-tree-node-list .bp6-tree-node")
      .all()
  }

  async getAllDescendants(task, filterVisible = false) {
    const descendants = await task
      .locator(".bp6-tree-node-list .bp6-tree-node")
      .all()
    if (!filterVisible) {
      return descendants
    }
    const visibleDescendants = []
    for (const descendant of descendants) {
      if (await descendant.isVisible()) {
        visibleDescendants.push(descendant)
      }
    }
    return visibleDescendants
  }

  async getTasksTableHeader() {
    return currentPage().locator("#tasks-table-header").first()
  }

  async getTasksTableRows() {
    return currentPage().locator("#tasks-table-header ~ tr").all()
  }
}
export default new ShowAllTasks()
