import Page from "./page"

const PAGE_URL = "/tasks/mine"

class MyTasks extends Page {
  open() {
    super.open(PAGE_URL)
  }

  openAs(user) {
    super.open(PAGE_URL, user)
  }

  openAsOnboardUser() {
    super.openAsOnboardUser(PAGE_URL)
  }

  getMyOrgAssignedTasks() {
    return browser.$("#my-org-assigned-tasks")
  }

  getMyResponsibleTasks() {
    return browser.$("#my-responsible-tasks")
  }

  getMyPendingTasks() {
    return browser.$("#my-tasks-with-pending-assessments")
  }

  getMyPendingTasksContent() {
    return browser.$("#my-tasks-with-pending-assessments").$("tbody")
  }

  getMyPendingTask(name) {
    return this.getMyPendingTasksContent().$(`//a[contains(text(), "${name}")]`)
  }
}

export default new MyTasks()
