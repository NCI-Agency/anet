import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/events/:uuid"
class ShowEvent extends Page {
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

  async getEventSeries() {
    return currentPage().locator('div[id="eventSeries"]').first()
  }

  async getLocation() {
    return currentPage().locator('div[id="location"]').first()
  }

  async getType() {
    return currentPage().locator('div[id="eventType"]').first()
  }

  async getStartDate() {
    return currentPage().locator('div[id="startDate"]').first()
  }

  async getEndDate() {
    return currentPage().locator('div[id="endDate"]').first()
  }

  async getStatus() {
    return currentPage().locator('div[id="status"]').first()
  }

  async getDescription() {
    return currentPage().locator('div[id="description"]').first()
  }

  async getOrganizations() {
    return currentPage().locator('div[id="eventOrganizations"]').first()
  }

  async getPeople() {
    return currentPage().locator('div[id="eventPeople"]').first()
  }

  async getTasks() {
    return currentPage().locator('div[id="eventTasks"]').first()
  }

  async getReports() {
    return currentPage().locator('div[id="eventReports"]').first()
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
export default new ShowEvent()
