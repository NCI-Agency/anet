import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/positions/new"
class CreatePosition extends Page {
  async getForm() {
    return currentPage().locator("form").first()
  }

  async getPositionNameInput() {
    return currentPage().locator("#name").first()
  }

  async getDuplicatesButton() {
    return currentPage()
      .locator('//button[text()="Possible Duplicates"]')
      .first()
  }

  async getModalContent() {
    return currentPage().locator("div.modal-content").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator("button.btn-close").first()
  }

  async getSimilarPosition() {
    return (await this.getModalContent())
      .locator("tbody tr:first-child td:first-child a")
      .first()
  }

  async getPositionNameHelpBlock() {
    return currentPage().locator("#fg-name div.invalid-feedback").first()
  }

  async getRoleMemberButton() {
    return currentPage().locator('label[for="role_MEMBER"]').first()
  }

  async getRoleMemberInput() {
    return currentPage().locator('input[id="role_MEMBER"]').first()
  }

  async getRoleDeputyButton() {
    return currentPage().locator('label[for="role_DEPUTY"]').first()
  }

  async getRoleDeputyInput() {
    return currentPage().locator('input[id="role_DEPUTY"]').first()
  }

  async getRoleLeaderButton() {
    return currentPage().locator('label[for="role_LEADER"]').first()
  }

  async getRoleLeaderInput() {
    return currentPage().locator('input[id="role_LEADER"]').first()
  }

  async getOrganizationInput() {
    return currentPage().locator("#organization").first()
  }

  async getOrganizationHelpBlock() {
    return currentPage()
      .locator("#fg-organization div.invalid-feedback")
      .first()
  }

  async getOrgAdvancedSelectFirstItem() {
    return currentPage()
      .locator(
        "#organization-popover tbody tr:first-child td:nth-child(2) span"
      )
      .first()
  }

  async getLocationInput() {
    return currentPage().locator("#location").first()
  }

  async getLocAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#location-popover tbody tr:first-child td:nth-child(2) span")
      .first()
  }

  async getAlertSuccess() {
    return currentPage().locator(".alert-success").first()
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async open() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForOrgAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getOrgAdvancedSelectFirstItem,
      value
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}
export default new CreatePosition()
