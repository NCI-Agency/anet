import Page from "./page"

class ShowOrganization extends Page {
  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getLongName() {
    return browser.$('div[id="longName"]')
  }

  async getLocation() {
    return browser.$('div[id="location"]')
  }

  async getProfile() {
    return browser.$('div[id="profile"]')
  }

  async getType() {
    return browser.$('div[id="type"]')
  }

  async getLeaders() {
    return browser.$('div[id="fg-Leaders"]')
  }

  async getLeaderPosition() {
    return browser.$("div#Leaders span")
  }

  async getLeaderPositionPerson() {
    return browser.$("div#Leaders span:nth-child(2)")
  }

  async getDeputies() {
    return browser.$('div[id="fg-Deputies"]')
  }

  async getDeputyPosition() {
    return browser.$("div#Deputies span")
  }

  async getDeputyPositionPerson() {
    return browser.$("div#Deputies span:nth-child(2)")
  }

  async waitForAlertSuccessToLoad() {
    if (!(await (await this.getAlertSuccess()).isDisplayed())) {
      await (await this.getAlertSuccess()).waitForExist()
      await (await this.getAlertSuccess()).waitForDisplayed()
    }
  }
}

export default new ShowOrganization()
