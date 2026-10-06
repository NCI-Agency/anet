import Page from "./page"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getUsers(selector) {
    const elem = await browser.$(selector)
    await elem.waitForExist()
    await elem.waitForDisplayed()
    const users = await elem.$$("span")
    return users.map(async user => await user.getText())
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
    await browser.$("fieldset").waitForDisplayed()
    return browser.$(".editable").isExisting()
  }

  async getHelpText() {
    const editable = await browser.$("fieldset .editable")
    const spans = await editable.$$("span")
    return await spans[spans.length - 1].getText()
  }
}

export default new Help()
