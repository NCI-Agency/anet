import Page from "./page"

class ShowOrganization extends Page {
  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  getLongName() {
    return browser.$('div[id="longName"')
  }

  getLocation() {
    return browser.$('div[id="location"')
  }

  getProfile() {
    return browser.$('div[id="profile"')
  }

  waitForAlertSuccessToLoad() {
    if (!this.getAlertSuccess().isDisplayed()) {
      this.getAlertSuccess().waitForExist()
      this.getAlertSuccess().waitForDisplayed()
    }
  }
}

export default new ShowOrganization()
