import Page from "./page"

const Page_URL = "/admin/authorizationGroups/new"

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
  get statusActiveButton() {
    return browser.$("#statusActiveButton")
  }
  get statusInactiveButton() {
    return browser.$("#statusInactiveButton")
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
    super.openAsAdminUser(Page_URL)
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
      5000,
      'Expected advanced select input to contain "' + value + '" after 5s'
    )
  }

  submitForm() {
    this.submitButton.click()
  }
}

export default new CreateAuthorizationGroup()
