import Page from "./page.js"

const PAGE_URL = "/tasks/mine"
class MyTasks extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async openAs(user) {
    await super.open(PAGE_URL, user)
  }

  async openAsOnboardUser() {
    await super.openAsOnboardUser(PAGE_URL)
  }

  async getMyOrgAssignedTasks() {
    return this.page.locator("#my-org-assigned-tasks").first()
  }

  async getMyResponsibleTasks() {
    return this.page.locator("#my-responsible-tasks").first()
  }

  async getMyPendingTasks() {
    return this.page.locator("#my-tasks-with-pending-assessments").first()
  }

  async getMyPendingTasksContent() {
    return (await this.getMyPendingTasks()).locator("fieldset").first()
  }

  async getMyPendingTasksBody() {
    return (await this.getMyPendingTasksContent()).locator("tbody").first()
  }

  async getMyPendingTask(name) {
    return (await this.getMyPendingTasksBody())
      .locator(`xpath=.//a[text()="${name}"]`)
      .first()
  }
}
export default MyTasks
