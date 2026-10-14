import { currentPage } from "../../support.js"
import Page from "../page.js"

const PAGE_URL = "/locations/:uuid"
class ShowLocation extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getEditButton() {
    return currentPage().locator('//a[text()="Edit"]').first()
  }

  async getEditAttachmentsButton() {
    return await currentPage().locator("#edit-attachments").first()
  }

  async getSuccessMsg() {
    return currentPage().locator('//div[text()="Location saved"]').first()
  }

  async getLatField() {
    return currentPage()
      .locator('div[name="location"] span:first-child')
      .first()
  }

  async getLngField() {
    return currentPage()
      .locator('div[name="location"] span:nth-child(3)')
      .first()
  }

  async getTable(tableName) {
    return currentPage().locator(`table.${tableName}`).first()
  }

  async getTableRows(tableName) {
    return (await this.getTable(tableName)).locator("tbody tr").all()
  }

  async getReportCollection() {
    return currentPage().locator("div.report-collection").first()
  }

  async getReportSummaries() {
    return (await this.getReportCollection())
      .locator("div.report-summary")
      .all()
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

  async getEditEngagementPlanningApprovalsButton() {
    return currentPage()
      .locator(
        '//button[contains(text(), "Edit Engagement planning approvals")]'
      )
      .first()
  }

  async getEditReportPublicationApprovalsButton() {
    return currentPage()
      .locator(
        '//button[contains(text(), "Edit Report publication approvals")]'
      )
      .first()
  }

  async getEditApprovalsModal() {
    return currentPage().locator(".modal").first()
  }

  async getModalContent() {
    return currentPage().locator("div.modal-content").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator(".btn-close").first()
  }

  async getEntityAvatar() {
    return currentPage()
      .locator("fieldset div.row div.text-center canvas")
      .first()
  }
}
export default new ShowLocation()
