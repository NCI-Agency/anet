import Page from "./page"

const PAGE_URL = "/positions/counterparts"

class MyTasks extends Page {
  open() {
    super.open(PAGE_URL)
  }

  openAs(user) {
    super.open(PAGE_URL, user)
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsOnboardUser() {
    super.openAsOnboardUser(PAGE_URL)
  }

  getMyCounterparts() {
    return browser.$("#my-counterparts")
  }

  getMyPendingCounterparts() {
    return browser.$("#my-counterparts-with-pending-assessments")
  }

  getMyPendingCounterpartsContent() {
    return browser.$("#my-counterparts-with-pending-assessments").$("tbody")
  }

  getMyPendingCounterpart(name) {
    return this.getMyPendingCounterpartsContent().$(`//a[text()="${name}"]`)
  }

  getMyCounterpart(name) {
    return this.getMyCounterparts().$(`//a[text()="${name}"]`)
  }
}

export default new MyTasks()
