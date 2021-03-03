import Page from "./page"

const PAGE_URL = "/organizations/new"

class CreateOrganization extends Page {
  get form() {
    return browser.$("form.form-horizontal")
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }

  submitForm() {
    this.submitButton.click()
  }
}

export default new CreateOrganization()
