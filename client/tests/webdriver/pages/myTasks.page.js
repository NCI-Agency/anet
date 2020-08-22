import Page from "./page"

const PAGE_URL = "/tasks/mine"

class MyTasks extends Page {
  open() {
    super.open(PAGE_URL)
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
}

export default new MyTasks()
