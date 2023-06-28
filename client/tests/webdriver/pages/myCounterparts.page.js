import Page from "./page"

const PAGE_URL = "/positions/counterparts"

class MyTasks extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async openAs(user) {
    await super.open(PAGE_URL, user)
  }

  async openAsSuperuser() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsOnboardUser() {
    await super.openAsOnboardUser(PAGE_URL)
  }

  async getMyCounterparts() {
    return browser.$("#my-counterparts")
  }

  async getMyPendingCounterparts() {
    return browser.$("#my-counterparts-with-pending-assessments")
  }

  async getMyPendingCounterpartsContent() {
    return (await this.getMyPendingCounterparts()).$("fieldset")
  }

  async getMyPendingCounterpartsBody() {
    return (await this.getMyPendingCounterpartsContent()).$("tbody")
  }

  async getMyPendingCounterpart(name) {
    return (await this.getMyPendingCounterpartsBody()).$(
      `//a[text()="${name}"]`
    )
  }

  async getMyCounterpart(name) {
    return (await this.getMyCounterparts()).$(`//a[text()="${name}"]`)
  }
}

export default new MyTasks()
