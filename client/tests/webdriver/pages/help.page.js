import Page from "./page"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSuperusers() {
    const superusersDiv = await browser.$(".superusers-list")
    await superusersDiv.waitForExist()
    await superusersDiv.waitForDisplayed()
    const superusers = await superusersDiv.$$("span")
    return superusers.map(async user => await user.getText())
  }

  async getAdministrators() {
    const adminsDiv = await browser.$(".admins-list")
    await adminsDiv.waitForExist()
    await adminsDiv.waitForDisplayed()
    const admins = await adminsDiv.$$("span")
    return admins.map(async user => await user.getText())
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
