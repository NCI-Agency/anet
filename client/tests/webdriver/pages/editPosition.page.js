import Page from "./page"

class EditPosition extends Page {
  get form() {
    return browser.$("form")
  }
  get typeAdvisorButton() {
    return browser.$("#typeAdvisorButton")
  }
  get typePrincipalButton() {
    return browser.$("#typePrincipalButton")
  }
  get organizationInput() {
    return browser.$("#organization")
  }
  get orgAdvancedSelectFirstItem() {
    return browser.$(
      "#organization-popover tbody tr:first-child td:nth-child(2) span"
    )
  }
  get alertSuccess() {
    return browser.$(".alert-success")
  }
  get cancelButton() {
    return browser.$("div.submit-buttons").$("button=Cancel")
  }
  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  open() {
    super.openAsSuperUser("/positions/new")
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }

  waitForOrgAdvancedSelectToChange(value) {
    this.orgAdvancedSelectFirstItem.waitForExist()
    return browser.waitUntil(
      () => {
        return this.orgAdvancedSelectFirstItem.getText() === value
      },
      5000,
      'Expected org advanced select input to contain "' + value + '" after 5s'
    )
  }

  submitForm() {
    this.submitButton.click()
  }
}

export default new EditPosition()
