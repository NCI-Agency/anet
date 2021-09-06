import Page from "./page"

const PAGE_URL = "/positions/new"
class CreatePosition extends Page {
  get form() {
    return browser.$("form")
  }

  get positionNameInput() {
    return browser.$("#name")
  }

  get duplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  get modalContent() {
    return browser.$("div.modal-content")
  }

  get modalCloseButton() {
    return this.modalContent.$("button.btn-close")
  }

  get similarPosition() {
    return this.modalContent.$("tbody tr:first-child td:first-child a")
  }

  get positionNameHelpBlock() {
    return browser.$("#fg-name div.invalid-feedback")
  }

  get typeAdvisorButton() {
    return browser.$('label[for="ADVISOR"]')
  }

  get typePrincipalButton() {
    return browser.$('label[for="PRINCIPAL"]')
  }

  get organizationInput() {
    return browser.$("#organization")
  }

  get organizationHelpBlock() {
    return browser.$("#fg-organization div.invalid-feedback")
  }

  get orgAdvancedSelectFirstItem() {
    return browser.$(
      "#organization-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  get locationInput() {
    return browser.$("#location")
  }

  get locationHelpBlock() {
    return browser.$("#fg-location div.invalid-feedback")
  }

  get locAdvancedSelectFirstItem() {
    return browser.$(
      "#location-popover tbody tr:first-child td:nth-child(2) span"
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
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdminUser() {
    super.openAsAdminUser(PAGE_URL)
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
      {
        timeout: 5000,
        timeoutMsg:
          'Expected org advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  submitForm() {
    this.submitButton.click()
  }
}

export default new CreatePosition()
