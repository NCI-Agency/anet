import Page from "./page"

const PAGE_URL = "/eventSeries/:uuid"

class ShowEventSeries extends Page {
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

  async getStatus() {
    return browser.$('div[id="status"]')
  }

  async getDescription() {
    return browser.$('div[id="description"]')
  }

  async getEventsTable() {
    return browser.$(".event-collection")
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable.$(`tbody tr:nth-child(${i}) td:first-child a`)
  }
}

export default new ShowEventSeries()
