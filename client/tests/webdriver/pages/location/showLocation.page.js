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

  async getEditAttachmentsButton() {
    return await browser.$("#edit-attachments")
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

  async getEditEngagementPlanningApprovalsButton() {
    return browser.$(
      '//button[contains(text(), "Edit Engagement planning approvals")]'
    )
  }

  async getEditReportPublicationApprovalsButton() {
    return browser.$(
      '//button[contains(text(), "Edit Report publication approvals")]'
    )
  }

  async getEditApprovalsModal() {
    return browser.$(".modal")
  }

  async getModalContent() {
    return browser.$("div.modal-content")
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).$(".btn-close")
  }
}
export default new ShowLocation()
