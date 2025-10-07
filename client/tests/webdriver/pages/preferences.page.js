import Page from "./page"

const PAGE_URL = "/preferences"

class Preferences extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async hasSubscriptionsEmailsPreference() {
    await browser.$("fieldset").waitForDisplayed()
    return browser
      .$('//label[text()="Email me about subscription updates"]')
      .isExisting()
  }

  async hasReportsEmailsPreference() {
    await browser.$("fieldset").waitForDisplayed()
    return browser
      .$('//label[text()="Email me about report approvals"]')
      .isExisting()
  }
}

export default new Preferences()
