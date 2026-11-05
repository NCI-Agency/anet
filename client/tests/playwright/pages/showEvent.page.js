import Page from "./page.js"

const PAGE_URL = "/events/:uuid"
class ShowEvent extends Page {
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

  async getEventSeries() {
    return this.page.locator('div[id="eventSeries"]').first()
  }

  async getLocation() {
    return this.page.locator('div[id="location"]').first()
  }

  async getType() {
    return this.page.locator('div[id="eventType"]').first()
  }

  async getStartDate() {
    return this.page.locator('div[id="startDate"]').first()
  }

  async getEndDate() {
    return this.page.locator('div[id="endDate"]').first()
  }

  async getStatus() {
    return this.page.locator('div[id="status"]').first()
  }

  async getDescription() {
    return this.page.locator('div[id="description"]').first()
  }

  async getOrganizations() {
    return this.page.locator('div[id="eventOrganizations"]').first()
  }

  async getPeople() {
    return this.page.locator('div[id="eventPeople"]').first()
  }

  async getTasks() {
    return this.page.locator('div[id="eventTasks"]').first()
  }

  async getReports() {
    return this.page.locator('div[id="eventReports"]').first()
  }

  async getEditAttachmentsButton() {
    return this.page.locator("#edit-attachments").first()
  }

  async getEntityAvatar() {
    return this.page.locator("fieldset div.row div.text-center canvas").first()
  }
}
export default ShowEvent
