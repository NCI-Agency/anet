import Page from "./page"

const PAGE_URL = "/admin/authorizationGroups/new"

class CreateAuthorizationGroup extends Page {
  async getForm() {
    return browser.$("form")
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getName() {
    return browser.$("#name")
  }

  async getDescription() {
    return browser.$("#description")
  }

  /* React Bootstrap v2 hides the input and styles the label. Input is not clickable.
        In order to click toggleButtonGroup, label needs to be grabbed */
  async getStatusActiveInput() {
    return browser.$("input#status_ACTIVE")
  }

  async getStatusInactiveInput() {
    return browser.$("input#status_INACTIVE")
  }

  async getStatusActiveButton() {
    return browser.$('label[for="status_ACTIVE"]')
  }

  async getStatusInactiveButton() {
    return browser.$('label[for="status_INACTIVE"]')
  }

  async getRelatedObjectsInput() {
    return browser.$("#relatedObjects")
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return browser.$(
      "#entitySelect-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async open() {
    // Only admin users can create authorization groups
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForRelatedObjectsAdvancedSelectToChange(value) {
    await (await this.getRelatedObjectsAdvancedSelectFirstItem()).waitForExist()
    return browser.waitUntil(
      async() => {
        return (
          (await (
            await this.getRelatedObjectsAdvancedSelectFirstItem()
          ).getText()) === value
        )
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected relatedObjects advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}

export default new CreateAuthorizationGroup()
