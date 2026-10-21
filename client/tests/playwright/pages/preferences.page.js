import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/preferences"

class Preferences extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSubscriptionsEmailsPreference() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return currentPage()
      .locator('//label[text()="Email me about subscription updates"]')
      .first()
  }

  async getReportsEmailsPreference() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return currentPage()
      .locator('//label[text()="Email me about report approvals"]')
      .first()
  }
}

export default new Preferences()
