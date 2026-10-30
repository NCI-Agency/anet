import Page from "./page.js"

const PAGE_URL = "/preferences"
class Preferences extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSubscriptionsEmailsPreference() {
    await this.page.locator("fieldset").first().waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page
      .locator('//label[text()="Email me about subscription updates"]')
      .first()
  }

  async getReportsEmailsPreference() {
    await this.page.locator("fieldset").first().waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page
      .locator('//label[text()="Email me about report approvals"]')
      .first()
  }
}
export default Preferences
