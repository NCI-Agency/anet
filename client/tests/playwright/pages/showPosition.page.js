import Page from "./page.js"

const PAGE_URL = "/positions/:uuid"
class ShowPosition extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getAuthorizationGroupsTable() {
    return this.page.locator("#authorizationGroups table").first()
  }

  async getAuthorizationGroup(i) {
    const agTable = await this.getAuthorizationGroupsTable()
    return agTable.locator(`tbody tr:nth-child(${i}) td:first-child a`).first()
  }

  async getEditHistoryButton() {
    return this.page.locator("button.edit-history").first()
  }

  async getEditAttachmentsButton() {
    return await this.page.locator("#edit-attachments").first()
  }

  async getEntityAvatar() {
    return this.page.locator("fieldset div.row div.text-center canvas").first()
  }
}
export default ShowPosition
