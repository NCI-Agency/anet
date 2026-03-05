import Page from "./page"

const PAGE_URL = "/admin/configureEventTypes"

class AdminEventTypes extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getEventTypesTable() {
    return browser.$("fieldset table")
  }

  async getEventTypesRows() {
    return (await this.getEventTypesTable()).$$("tbody tr")
  }

  async getEventTypesRelatedEventsColumn(row) {
    return row.$("td:nth-child(5)")
  }

  async getEventTypesRelatedEventsCount(row) {
    return (await this.getEventTypesRelatedEventsColumn(row)).$("span")
  }

  async getEventTypesRelatedEventsButton(row) {
    return (await this.getEventTypesRelatedEventsColumn(row)).$("button")
  }
}

export default new AdminEventTypes()
