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
    await waitFor(superusersDiv, "attached")
    await waitFor(superusersDiv, "visible")
    const superusers = await superusersDiv.locator("span").all()
    return Promise.all(
      superusers.map(async user => (await user.innerText()).trim())
    )
  }

  async getAdministrators() {
    const adminsDiv = await currentPage().locator(".admins-list").first()
    await waitFor(adminsDiv, "attached")
    await waitFor(adminsDiv, "visible")
    const admins = await adminsDiv.locator("span").all()
    return Promise.all(
      admins.map(async user => (await user.innerText()).trim())
    )
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
