import Page from "./page"

const PAGE_URL = "/admin/authorizationGroups/new"

class CreateAuthorizationGroup extends Page {
  get form() {
    return browser.$("form")
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  get name() {
    return browser.$("#name")
  }

  get description() {
    return browser.$("#description")
  }

  /* React Bootstrap v2 hides the input and styles the label. Input is not clickable.
        In order to click toggleButtonGroup, label needs to be grabbed */
  get statusActiveInput() {
    return browser.$("input#ACTIVE")
  }

  get statusInactiveInput() {
    return browser.$("input#INACTIVE")
  }

  get statusActiveButton() {
    return browser.$('label[for="ACTIVE"]')
  }

  get statusInactiveButton() {
    return browser.$('label[for="INACTIVE"]')
  }

  get positionsInput() {
    return browser.$("#positions")
  }

  get positionsAdvancedSelectFirstItem() {
    return browser.$(
      "#positions-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  open() {
    // Only admin users can create authorization groups
    super.openAsAdminUser(PAGE_URL)
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }

  waitForPositionsAdvancedSelectToChange(value) {
    this.positionsAdvancedSelectFirstItem.waitForExist()
    return browser.waitUntil(
      () => {
        return this.positionsAdvancedSelectFirstItem.getText() === value
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
    this.submitButton.click()
  }
}

export default new CreateAuthorizationGroup()
