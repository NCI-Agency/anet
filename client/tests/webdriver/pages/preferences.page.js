import Page from "./page"

const PAGE_URL = "/preferences"

class Preferences extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async hasSubscriptionsEmailsPreference() {
    await browser.$("fieldset").waitForDisplayed()
    return browser
      .$('//label[text()="Receive emails related to subscriptions"]')
      .isExisting()
  }

  async hasReportsEmailsPreference() {
    await browser.$("fieldset").waitForDisplayed()
    return browser
      .$('//label[text()="Receive emails related to reports"]')
      .isExisting()
  }
}

export default new Preferences()
