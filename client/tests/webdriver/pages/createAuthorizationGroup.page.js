import Page from "./page"

const PAGE_URL = "/admin/authorizationGroups/new"

class CreateAuthorizationGroup extends Page {
  getForm() {
    return browser.$("form")
  }

  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  getName() {
    return browser.$("#name")
  }

  getDescription() {
    return browser.$("#description")
  }

  /* React Bootstrap v2 hides the input and styles the label. Input is not clickable.
        In order to click toggleButtonGroup, label needs to be grabbed */
  getStatusActiveInput() {
    return browser.$("input#status_ACTIVE")
  }

  getStatusInactiveInput() {
    return browser.$("input#status_INACTIVE")
  }

  getStatusActiveButton() {
    return browser.$('label[for="status_ACTIVE"]')
  }

  getStatusInactiveButton() {
    return browser.$('label[for="status_INACTIVE"]')
  }

  getPositionsInput() {
    return browser.$("#positions")
  }

  getPositionsAdvancedSelectFirstItem() {
    return browser.$(
      "#positions-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  open() {
    // Only admin users can create authorization groups
    super.openAsAdminUser(PAGE_URL)
  }

  waitForPositionsAdvancedSelectToChange(value) {
    this.getPositionsAdvancedSelectFirstItem().waitForExist()
    return browser.waitUntil(
      () => {
        return this.getPositionsAdvancedSelectFirstItem().getText() === value
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected positions advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  submitForm() {
    this.getSubmitButton().click()
  }
}

export default new CreateAuthorizationGroup()
