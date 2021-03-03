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

  get myOrgAssignedTasks() {
    return browser.$("#my-org-assigned-tasks")
  }

  get myResponsibleTasks() {
    return browser.$("#my-responsible-tasks")
  }

  get myPendingTasks() {
    return browser.$("#my-tasks-with-pending-assessments")
  }

  get myPendingTasksContent() {
    return browser.$("#my-tasks-with-pending-assessments").$("tbody")
  }

  getMyPendingTask(name) {
    return this.myPendingTasksContent.$(`//a[contains(text(), "${name}")]`)
  }
}

export default new MyTasks()
