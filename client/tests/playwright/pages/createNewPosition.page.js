import Page from "./page.js"

const PAGE_URL = "/positions/new"
class CreatePosition extends Page {
  async getForm() {
    return this.page.locator("form").first()
  }

  async getPositionNameInput() {
    return this.page.locator("#name").first()
  }

  async getDuplicatesButton() {
    return this.page.locator('//button[text()="Possible Duplicates"]').first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
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
    return this.page.locator("#fg-name div.invalid-feedback").first()
  }

  async getRoleMemberButton() {
    return this.page.locator('label[for="role_MEMBER"]').first()
  }

  async getRoleMemberInput() {
    return this.page.locator('input[id="role_MEMBER"]').first()
  }

  async getRoleDeputyButton() {
    return this.page.locator('label[for="role_DEPUTY"]').first()
  }

  async getRoleDeputyInput() {
    return this.page.locator('input[id="role_DEPUTY"]').first()
  }

  async getRoleLeaderButton() {
    return this.page.locator('label[for="role_LEADER"]').first()
  }

  async getRoleLeaderInput() {
    return this.page.locator('input[id="role_LEADER"]').first()
  }

  async getOrganizationInput() {
    return this.page.locator("#organization").first()
  }

  async getOrganizationHelpBlock() {
    return this.page.locator("#fg-organization div.invalid-feedback").first()
  }

  async getOrgAdvancedSelectFirstItem() {
    return this.page
      .locator(
        "#organization-popover tbody tr:first-child td:nth-child(2) span"
      )
      .first()
  }

  async getLocationInput() {
    return this.page.locator("#location").first()
  }

  async getLocAdvancedSelectFirstItem() {
    return this.page
      .locator("#location-popover tbody tr:first-child td:nth-child(2) span")
      .first()
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async open() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForOrgAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getOrgAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}
export default CreatePosition
