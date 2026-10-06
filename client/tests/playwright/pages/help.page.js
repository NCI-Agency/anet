import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getUsers(selector) {
    const elem = await currentPage().locator(selector).first()
    await waitFor(elem, "visible")
    const users = await elem.locator("span").all()
    return Promise.all(users.map(async user => (await user.innerText()).trim()))
  }

  async getSuperusers() {
    return this.getUsers(".superusers-list")
  }

  async getTenantAdministrators() {
    return this.getUsers(".tenant-admins-list")
  }

  async getAdministrators() {
    return this.getUsers(".admins-list")
  }

  async getHelpText() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return currentPage().locator("fieldset .editable").first()
  }
}

export default new Help()
