import Page from "./page.js"

const PAGE_URL = "/top-tasks"
class ShowAllTasks extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getTitle() {
    return this.page.locator("h4.legend").first()
  }

  async getTree() {
    return this.page.locator(".bp6-tree").first()
  }

  async getAllTasks() {
    return (await this.getTree()).locator(".bp6-tree-node-list .bp6-tree-node")
  }

  async getAllDescendants(task) {
    return task.locator(".bp6-tree-node-list .bp6-tree-node")
  }

  async getTasksTableHeader() {
    return this.page.locator("#tasks-table-header").first()
  }

  async getTasksTableRows() {
    return this.page.locator("#tasks-table-header ~ tr").all()
  }
}
export default ShowAllTasks
