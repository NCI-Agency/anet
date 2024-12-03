import Page from "../page"

const PAGE_URL = "/locations/:uuid"

class ShowLocation extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getEditButton() {
    return browser.$('//a[text()="Edit"]')
  }

  async getSuccessMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  async getLatField() {
    return browser.$('div[name="location"] span:first-child')
  }

  async getLngField() {
    return browser.$('div[name="location"] span:nth-child(3)')
  }

  async getTable(tableName) {
    return browser.$(`table.${tableName}`)
  }

  async getTableRows(tableName) {
    return (await this.getTable(tableName)).$$("tbody tr")
  }

  async getReportCollection() {
    return browser.$("div.report-collection")
  }

  async getReportSummaries() {
    return (await this.getReportCollection()).$$("div.report-summary")
  }

  async getEventsTable() {
    return browser.$(".event-collection")
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable.$(`tbody tr:nth-child(${i}) td:first-child a`)
  }
}
export default new ShowLocation()
