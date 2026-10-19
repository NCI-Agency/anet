import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/eventSeries/:uuid"

class ShowEventSeries extends Page {
  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getTitle() {
    return currentPage().locator(".title-text").first()
  }

  async getOwnerOrganization() {
    return currentPage().locator('div[id="ownerOrg"]').first()
  }

  async getHostRelatedObjects() {
    return currentPage().locator('div[id="hostRelatedObjects"]').first()
  }

  async getAdminOrganization() {
    return currentPage().locator('div[id="adminOrg"]').first()
  }

  async getStatus() {
    return currentPage().locator('div[id="status"]').first()
  }

  async getDescription() {
    return currentPage().locator('div[id="description"]').first()
  }

  async getEventsTable() {
    return currentPage().locator(".event-collection").first()
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable
      .locator(`tbody tr:nth-child(${i}) td:first-child a`)
      .first()
  }

  async getEditAttachmentsButton() {
    return currentPage().locator("#edit-attachments").first()
  }

  async getEntityAvatar() {
    return currentPage()
      .locator("fieldset div.row div.text-center canvas")
      .first()
  }
}

export default new ShowEventSeries()
