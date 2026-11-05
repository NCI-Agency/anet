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
    return this.page.getByRole("link", { name: "Edit", exact: true }).first()
  }

  async getEditAttachmentsButton() {
    return await this.page.locator("#edit-attachments").first()
  }

  async getSuccessMsg() {
    return this.page.getByText("Location saved", { exact: true }).first()
  }

  async getLatField() {
    return this.page.locator('div[name="location"] span:first-child').first()
  }

  async getLngField() {
    return this.page.locator('div[name="location"] span:nth-child(3)').first()
  }

  async getTable(tableName) {
    return this.page.locator(`table.${tableName}`).first()
  }

  async getTableRows(tableName) {
    return (await this.getTable(tableName)).locator("tbody tr")
  }

  async getReportCollection() {
    return this.page.locator("div.report-collection").first()
  }

  async getReportSummaries() {
    return (await this.getReportCollection()).locator("div.report-summary")
  }

  async getEventsTable() {
    return this.page.locator(".event-collection").first()
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable
      .locator(`tbody tr:nth-child(${i}) td:first-child a`)
      .first()
  }

  async getEditEngagementPlanningApprovalsButton() {
    return this.page
      .getByRole("button", {
        name: "Edit Engagement planning approvals",
        exact: false
      })
      .first()
  }

  async getEditReportPublicationApprovalsButton() {
    return this.page
      .getByRole("button", {
        name: "Edit Report publication approvals",
        exact: false
      })
      .first()
  }

  async getEditApprovalsModal() {
    return this.page.locator(".modal").first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator(".btn-close").first()
  }

  async getEntityAvatar() {
    return this.page.locator("fieldset div.row div.text-center canvas").first()
  }
}

export default ShowLocation
