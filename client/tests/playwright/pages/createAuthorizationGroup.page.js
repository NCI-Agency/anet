import Page from "./page.js"

const PAGE_URL = "/communities/new"
class CreateAuthorizationGroup extends Page {
  async getForm() {
    return this.page.locator("form").first()
  }

  async getName() {
    return this.page.locator("#name").first()
  }

  async getNameDisplay() {
    return this.page.locator(".title-text").first()
  }

  async getDescription() {
    return this.page.locator("#description").first()
  }

  /* React Bootstrap v2 hides the input and styles the label. Input is not clickable.
        In order to click toggleButtonGroup, label needs to be grabbed */
  async getStatusActiveInput() {
    return this.page.locator("input#status_ACTIVE").first()
  }

  async getStatusInactiveInput() {
    return this.page.locator("input#status_INACTIVE").first()
  }

  async getStatusActiveButton() {
    return this.page.locator('label[for="status_ACTIVE"]').first()
  }

  async getStatusInactiveButton() {
    return this.page.locator('label[for="status_INACTIVE"]').first()
  }

  async getDistributionList() {
    return this.page.locator("#distributionList").first()
  }

  async getForSensitiveInformation() {
    return this.page.locator("#forSensitiveInformation").first()
  }

  async getRelatedObjectsInput() {
    return this.page
      .locator('.related_objects input[name="entitySelect"]')
      .first()
  }

  async getRelatedObjectsTable() {
    return this.page.locator(".related_objects_table").first()
  }

  async getRelatedObjectsTableEntry(relatedObjectText) {
    return (await this.getRelatedObjectsTable())
      .locator(`xpath=.//tr/td/span//a[text()="${relatedObjectText}"]`)
      .first()
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return this.page
      .locator("#entitySelect-popover tbody tr:first-child")
      .first()
  }

  async waitForRelatedObjectsAdvancedSelectToContain(value) {
    return this.waitForElementToContain(
      this.getRelatedObjectsAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async getAdministrativePositionsInput() {
    return this.page.locator('input[name="administrativePositions"]').first()
  }

  async waitForAdministrativePositionsAdvancedSelectToContain(value) {
    return this.waitForElementToContain(
      this.getAdministrativePositionsAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async getAdministrativePositionsTable() {
    return this.page.locator(".positions_table").first()
  }

  async getAdministrativePositionsTableEntry(administrativePositionText) {
    return (await this.getAdministrativePositionsTable())
      .locator(`xpath=.//tr/td/span//a[text()="${administrativePositionText}"]`)
      .first()
  }

  async getAdministrativePositionsAdvancedSelectFirstItem() {
    return this.page
      .locator("#administrativePositions-popover tbody tr:first-child")
      .first()
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async getEditButton() {
    return this.page.locator("//a[text()='Edit']").first()
  }

  async getMyAuthorizationGroups() {
    return this.page.locator("#my-authorization-groups").first()
  }

  async getAuthorizationGroupLink(authorizationGroupName) {
    return (await this.getMyAuthorizationGroups())
      .locator(`xpath=.//tr/td/span//a[text()="${authorizationGroupName}"]`)
      .first()
  }

  async open() {
    // Only admin users can create communities
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}
export default CreateAuthorizationGroup
