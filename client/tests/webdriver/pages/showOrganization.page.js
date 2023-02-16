import Page from "./page"

class ShowOrganization extends Page {
  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getLongName() {
    return browser.$('div[id="longName"')
  }

  async getLocation() {
    return browser.$('div[id="location"')
  }

  async getProfile() {
    return browser.$('div[id="profile"')
  }

  async waitForAlertSuccessToLoad() {
    if (!(await (await this.getAlertSuccess()).isDisplayed())) {
      await (await this.getAlertSuccess()).waitForExist()
      await (await this.getAlertSuccess()).waitForDisplayed()
    }
  }
}

export default new ShowOrganization()
