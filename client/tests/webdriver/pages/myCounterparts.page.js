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

  get myCounterparts() {
    return browser.$("#my-counterparts")
  }

  get myPendingCounterparts() {
    return browser.$("#my-counterparts-with-pending-assessments")
  }

  get myPendingCounterpartsContent() {
    return browser.$("#my-counterparts-with-pending-assessments").$("tbody")
  }

  getMyPendingCounterpart(name) {
    return this.myPendingCounterpartsContent.$(`//a[text()="${name}"]`)
  }

  getMyCounterpart(name) {
    return this.myCounterparts.$(`//a[text()="${name}"]`)
  }
}

export default new MyTasks()
