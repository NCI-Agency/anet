import Page from "./page"

class ShowOrganization extends Page {
  get alertSuccess() {
    return browser.$(".alert-success")
  }

  get longName() {
    return browser.$('div[id="longName"')
  }

  get location() {
    return browser.$('div[id="location"')
  }

  get profile() {
    return browser.$('div[id="profile"')
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }
}

export default new ShowOrganization()
