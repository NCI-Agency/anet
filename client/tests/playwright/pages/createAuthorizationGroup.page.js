import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/communities/new"
class CreateAuthorizationGroup extends Page {
  async getForm() {
    return currentPage().locator("form").first()
  }

  async getAlertSuccess() {
    return currentPage().locator(".alert-success").first()
  }

  async getName() {
    return currentPage().locator("#name").first()
  }

  async getNameDisplay() {
    return currentPage().locator(".title-text").first()
  }

  async getDescription() {
    return currentPage().locator("#description").first()
  }

  /* React Bootstrap v2 hides the input and styles the label. Input is not clickable.
        In order to click toggleButtonGroup, label needs to be grabbed */
  async getStatusActiveInput() {
    return currentPage().locator("input#status_ACTIVE").first()
  }

  async getStatusInactiveInput() {
    return currentPage().locator("input#status_INACTIVE").first()
  }

  async getStatusActiveButton() {
    return currentPage().locator('label[for="status_ACTIVE"]').first()
  }

  async getStatusInactiveButton() {
    return currentPage().locator('label[for="status_INACTIVE"]').first()
  }

  async getDistributionList() {
    return currentPage().locator("#distributionList").first()
  }

  async getForSensitiveInformation() {
    return currentPage().locator("#forSensitiveInformation").first()
  }

  async getRelatedObjectsInput() {
    return currentPage()
      .locator('.related_objects input[name="entitySelect"]')
      .first()
  }

  async getRelatedObjectsTable() {
    return currentPage().locator(".related_objects_table").first()
  }

  async getRelatedObjectsTableEntry(relatedObjectText) {
    return (await this.getRelatedObjectsTable())
      .locator(`xpath=.//tr/td/span//a[text()="${relatedObjectText}"]`)
      .first()
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#entitySelect-popover tbody tr:first-child")
      .first()
  }

  async waitForRelatedObjectsAdvancedSelectToContain(value) {
    return this.waitForElementToContain(
      this.getRelatedObjectsAdvancedSelectFirstItem,
      value
    )
  }

  async getAdministrativePositionsInput() {
    return currentPage()
      .locator('input[name="administrativePositions"]')
      .first()
  }

  async waitForAdministrativePositionsAdvancedSelectToContain(value) {
    return this.waitForElementToContain(
      this.getAdministrativePositionsAdvancedSelectFirstItem,
      value
    )
  }

  async getAdministrativePositionsTable() {
    return currentPage().locator(".positions_table").first()
  }

  async getAdministrativePositionsTableEntry(administrativePositionText) {
    return (await this.getAdministrativePositionsTable())
      .locator(`xpath=.//tr/td/span//a[text()="${administrativePositionText}"]`)
      .first()
  }

  async getAdministrativePositionsAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#administrativePositions-popover tbody tr:first-child")
      .first()
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async getEditButton() {
    return currentPage().locator("//a[text()='Edit']").first()
  }

  async getMyAuthorizationGroups() {
    return currentPage().locator("#my-authorization-groups").first()
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
export default new CreateAuthorizationGroup()
