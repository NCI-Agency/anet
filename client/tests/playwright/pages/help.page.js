import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getUsers(selector) {
    const elem = await currentPage().locator(selector).first()
    await waitFor(elem, "attached")
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

  async hasHelpText() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return (await currentPage().locator(".editable").first().count()) > 0
  }

  async getHelpText() {
    const editable = await currentPage().locator("fieldset .editable").first()
    const spans = await editable.locator("span").all()
    return (await spans[spans.length - 1].innerText()).trim()
  }
}

export default new Help()
