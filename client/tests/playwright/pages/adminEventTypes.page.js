import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/admin/configureEventTypes"

class AdminEventTypes extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getEventTypesTable() {
    return currentPage().locator("fieldset table").first()
  }

  async getEventTypesRows() {
    return (await this.getEventTypesTable()).locator("tbody tr").all()
  }

  async getEventTypesRelatedEventsColumn(row) {
    return row.locator("td:nth-child(5)").first()
  }

  async getEventTypesRelatedEventsCount(row) {
    return (await this.getEventTypesRelatedEventsColumn(row))
      .locator("span")
      .first()
  }

  async getEventTypesRelatedEventsButton(row) {
    return (await this.getEventTypesRelatedEventsColumn(row))
      .locator("button")
      .first()
  }
}

export default new AdminEventTypes()
