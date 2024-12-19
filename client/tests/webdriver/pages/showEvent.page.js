import Page from "./page"

const PAGE_URL = "/events/:uuid"

class ShowEvent extends Page {
  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getTitle() {
    return browser.$(".title-text")
  }

  async getHostOrganization() {
    return browser.$('div[id="hostOrg"]')
  }

  async getAdminOrganization() {
    return browser.$('div[id="adminOrg"]')
  }

  async getEventSeries() {
    return browser.$('div[id="eventSeries"]')
  }

  async getLocation() {
    return browser.$('div[id="location"]')
  }

  async getType() {
    return browser.$('div[id="type"]')
  }

  async getStartDate() {
    return browser.$('div[id="startDate"]')
  }

  async getEndDate() {
    return browser.$('div[id="endDate"]')
  }

  async getStatus() {
    return browser.$('div[id="status"]')
  }

  async getDescription() {
    return browser.$('div[id="description"]')
  }

  async getOrganizations() {
    return browser.$('div[id="eventOrganizations"]')
  }

  async getPeople() {
    return browser.$('div[id="eventPeople"]')
  }

  async getTasks() {
    return browser.$('div[id="eventTasks"]')
  }

  async getReports() {
    return browser.$('div[id="eventReports"]')
  }
}

export default new ShowEvent()
