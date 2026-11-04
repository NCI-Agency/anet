import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSuperuserLinks() {
    return currentPage().locator(".superusers-list").getByRole("link")
  }

  async getAdministratorLinks() {
    return currentPage().locator(".admins-list").getByRole("link")
  }

  async getHelpText() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return currentPage().locator("fieldset .editable").first()
  }
}

export default new Help()
