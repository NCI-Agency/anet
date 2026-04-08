import Page from "./page"

const PAGE_URL = "/communities/new"

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

  async getDistributionList() {
    return browser.$("#distributionList")
  }

  async getForSensitiveInformation() {
    return browser.$("#forSensitiveInformation")
  }

  async getRelatedObjectsInput() {
    return browser.$('.related_objects input[name="entitySelect"]')
  }

  async getRelatedObjectsTable() {
    return browser.$(".related_objects_table")
  }

  async getRelatedObjectsTableEntry(relatedObjectText) {
    return (await this.getRelatedObjectsTable()).$(
      `.//tr/td/span//a[text()="${relatedObjectText}"]`
    )
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return browser.$("#entitySelect-popover tbody tr:first-child")
  }

  async getAdministrativePositionsInput() {
    return browser.$('input[name="administrativePositions"]')
  }

  async getAdministrativePositionsTable() {
    return browser.$(".positions_table")
  }

  async getAdministrativePositionsTableEntry(administrativePositionText) {
    return (await this.getAdministrativePositionsTable()).$(
      `.//tr/td/span//a[text()="${administrativePositionText}"]`
    )
  }

  async getAdministrativePositionsAdvancedSelectFirstItem() {
    return browser.$("#administrativePositions-popover tbody tr:first-child")
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getEditButton() {
    return browser.$("//a[text()='Edit']")
  }

  async getMyAuthorizationGroups() {
    return browser.$("#my-authorization-groups")
  }

  async getAuthorizationGroupLink(authorizationGroupName) {
    return (await this.getMyAuthorizationGroups()).$(
      `.//tr/td/span//a[text()="${authorizationGroupName}"]`
    )
  }

  async open() {
    // Only admin users can create communities
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForAdvancedSelectToChange(value, getFirstItemCallback) {
    return browser.waitUntil(
      async () => {
        const el = await getFirstItemCallback()
        return (await el.getText()).includes(value)
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
