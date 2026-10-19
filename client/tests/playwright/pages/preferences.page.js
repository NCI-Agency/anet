import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/preferences"

class Preferences extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async hasSubscriptionsEmailsPreference() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return (
      (await currentPage()
        .locator('//label[text()="Email me about subscription updates"]')
        .first()
        .count()) > 0
    )
  }

  async hasReportsEmailsPreference() {
    await waitFor(currentPage().locator("fieldset").first(), "visible")
    return (
      (await currentPage()
        .locator('//label[text()="Email me about report approvals"]')
        .first()
        .count()) > 0
    )
  }
}

export default new Preferences()
