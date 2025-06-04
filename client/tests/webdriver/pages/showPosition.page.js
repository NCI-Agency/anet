import Page from "./page"

const PAGE_URL = "/positions/:uuid"

class ShowPosition extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getAuthorizationGroupsTable() {
    return browser.$("#authorizationGroups table")
  }

  async getAuthorizationGroup(i) {
    const agTable = await this.getAuthorizationGroupsTable()
    return agTable.$(`tbody tr:nth-child(${i}) td:first-child a`)
  }

  async getEditHistoryButton() {
    return browser.$("div.edit-history button")
  }

  async getEditAttachmentsButton() {
    return await browser.$("#edit-attachments")
  }

  async getEntityAvatar() {
    return browser.$("fieldset div.row div.text-center canvas")
  }
}

export default new ShowPosition()
