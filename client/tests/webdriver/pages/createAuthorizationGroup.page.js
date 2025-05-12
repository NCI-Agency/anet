import Page from "./page"

const PAGE_URL = "/authorizationGroups/new"

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

  async getNameDisplay() {
    return browser.$(".title-text")
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
    return browser.$("#authorizationGroupRelatedObjects")
  }

  async getRelatedObjectsTable() {
    return browser.$(".related_objects_table")
  }

  async getRelatedObjectsTableEntry(relatedObjectText) {
    return (await this.getRelatedObjectsTable()).$(
      `.//tr/td/span/a[text()="${relatedObjectText}"]`
    )
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return browser.$(
      "#entitySelect-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getAdministrativePositionsInput() {
    return browser.$("#administrativePositions")
  }

  async getAdministrativePositionsTable() {
    return browser.$(".positions_table")
  }

  async getAdministrativePositionsTableEntry(administrativePositionText) {
    return (await this.getAdministrativePositionsTable()).$(
      `.//tr/td/span/a[text()="${administrativePositionText}"]`
    )
  }

  async getAdministrativePositionsAdvancedSelectFirstItem() {
    return browser.$(
      "#administrativePositions-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getEditButton() {
    return browser.$("//a[text()='Edit']")
  }

  async getMemberTypeButton(memberType) {
    return browser.$(`button=${memberType}`)
  }

  async getMyAuthorizationGroups() {
    return browser.$("#my-authorization-groups")
  }

  async getAuthorizationGroupLink(authorizationGroupName) {
    return (await this.getMyAuthorizationGroups()).$(
      `.//tr/td/span/a[text()="${authorizationGroupName}"]`
    )
  }

  async open() {
    // Only admin users can create communities
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForAdvancedSelectToChange(value, getFirstItemCallback) {
    await (await getFirstItemCallback()).waitForExist()
    return browser.waitUntil(
      async() => {
        return (await (await getFirstItemCallback()).getText()) === value
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected advanced select input to contain "' + value + '" after 5s'
      }
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}

export default new CreateAuthorizationGroup()
