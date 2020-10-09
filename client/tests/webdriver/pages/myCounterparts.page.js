import Page from "./page"

const PAGE_URL = "/positions/counterparts"

class MyTasks extends Page {
  open() {
    super.open(PAGE_URL)
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
    return browser.$("#my-pending-counterparts").$("tbody")
  }

  get myPendingCounterpartsContent() {
    return browser.$("#my-pending-counterparts").$("tbody")
  }
}

export default new MyTasks()
