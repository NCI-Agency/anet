import Page from "./page.js"

const PAGE_URL = "/eventSeries/:uuid"
class ShowEventSeries extends Page {
  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getTitle() {
    return this.page.locator(".title-text").first()
  }

  async getOwnerOrganization() {
    return this.page.locator('div[id="ownerOrg"]').first()
  }

  async getHostRelatedObjects() {
    return this.page.locator('div[id="hostRelatedObjects"]').first()
  }

  async getAdminOrganization() {
    return this.page.locator('div[id="adminOrg"]').first()
  }

  async getStatus() {
    return this.page.locator('div[id="status"]').first()
  }

  async getDescription() {
    return this.page.locator('div[id="description"]').first()
  }

  async getEventsTable() {
    return this.page.locator(".event-collection").first()
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable
      .locator(`tbody tr:nth-child(${i}) td:first-child a`)
      .first()
  }

  async getEditAttachmentsButton() {
    return this.page.locator("#edit-attachments").first()
  }

  async getEntityAvatar() {
    return this.page.locator("fieldset div.row div.text-center canvas").first()
  }
}
export default ShowEventSeries
