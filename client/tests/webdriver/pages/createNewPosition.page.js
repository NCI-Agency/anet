import Page from "./page"

const PAGE_URL = "/positions/new"
class CreatePosition extends Page {
  getForm() {
    return browser.$("form")
  }

  getPositionNameInput() {
    return browser.$("#name")
  }

  getDuplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  getModalContent() {
    return browser.$("div.modal-content")
  }

  getModalCloseButton() {
    return this.getModalContent().$("button.btn-close")
  }

  getSimilarPosition() {
    return this.getModalContent().$("tbody tr:first-child td:first-child a")
  }

  getPositionNameHelpBlock() {
    return browser.$("#fg-name div.invalid-feedback")
  }

  getTypeAdvisorButton() {
    return browser.$('label[for="type_ADVISOR"]')
  }

  getTypePrincipalButton() {
    return browser.$('label[for="type_PRINCIPAL"]')
  }

  getOrganizationInput() {
    return browser.$("#organization")
  }

  getOrganizationHelpBlock() {
    return browser.$("#fg-organization div.invalid-feedback")
  }

  getOrgAdvancedSelectFirstItem() {
    return browser.$(
      "#organization-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  getLocationInput() {
    return browser.$("#location")
  }

  getLocationHelpBlock() {
    return browser.$("#fg-location div.invalid-feedback")
  }

  getLocAdvancedSelectFirstItem() {
    return browser.$(
      "#location-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  getCancelButton() {
    return browser.$("div.submit-buttons").$("button=Cancel")
  }

  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  open() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdminUser() {
    super.openAsAdminUser(PAGE_URL)
  }

  waitForOrgAdvancedSelectToChange(value) {
    this.getOrgAdvancedSelectFirstItem().waitForExist()
    return browser.waitUntil(
      () => {
        return this.getOrgAdvancedSelectFirstItem().getText() === value
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
    this.getSubmitButton().click()
  }
}

export default new CreatePosition()
