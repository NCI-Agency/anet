import { currentPage } from "../support.js"
import Page from "./page.js"

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
    return currentPage().locator("#my-counterparts").first()
  }

  async getMyPendingCounterparts() {
    return currentPage()
      .locator("#my-counterparts-with-pending-assessments")
      .first()
  }

  async getMyPendingCounterpartsContent() {
    return (await this.getMyPendingCounterparts()).locator("fieldset").first()
  }

  async getMyPendingCounterpartsBody() {
    return (await this.getMyPendingCounterpartsContent())
      .locator("tbody")
      .first()
  }

  async getMyPendingCounterpart(name) {
    return (await this.getMyPendingCounterpartsBody())
      .locator(`xpath=.//a[text()="${name}"]`)
      .first()
  }

  async getMyCounterpart(name) {
    return (await this.getMyCounterparts())
      .locator(`xpath=.//a[text()="${name}"]`)
      .first()
  }
}
export default new MyTasks()
