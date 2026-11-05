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
      .getByText("Email me about subscription updates", { exact: true })
      .first()
  }

  async getReportsEmailsPreference() {
    await this.page.locator("fieldset").first().waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page
      .getByText("Email me about report approvals", { exact: true })
      .first()
  }
}
export default Preferences
