import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSuperusers() {
    const superusersDiv = await currentPage()
      .locator(".superusers-list")
      .first()
    await waitFor(superusersDiv, "visible")
    const superusers = await superusersDiv.locator("span").all()
    return Promise.all(
      superusers.map(async user => (await user.innerText()).trim())
    )
  }

  async getAdministrators() {
    const adminsDiv = await currentPage().locator(".admins-list").first()
    await waitFor(adminsDiv, "visible")
    const admins = await adminsDiv.locator("span").all()
    return Promise.all(
      admins.map(async user => (await user.innerText()).trim())
    )
  }

  async getHelpText() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return currentPage().locator("fieldset .editable").first()
  }
}

export default new Help()
