import Page from "./page"

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
    return browser.$("#my-org-assigned-tasks")
  }

  async getMyResponsibleTasks() {
    return browser.$("#my-responsible-tasks")
  }

  async getMyPendingTasks() {
    return browser.$("#my-tasks-with-pending-assessments")
  }

  async getMyPendingTasksContent() {
    return (await browser.$("#my-tasks-with-pending-assessments")).$("tbody")
  }

  async getMyPendingTask(name) {
    return (await this.getMyPendingTasksContent()).$(
      `//a[contains(text(), "${name}")]`
    )
  }
}

export default new MyTasks()
