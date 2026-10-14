import { currentPage } from "../support.js"
import { CreateReport } from "./createReport.page.js"

const PAGE_URL = "/reports/new"
const attId = "reportPeople"
const tskId = "tasks"
class CreateFutureReport extends CreateReport {
  async getEngagementDate() {
    return currentPage().locator('input[id="engagementDate"]').first()
  }

  async getAttendeesFieldFormGroup() {
    return currentPage().locator(`div[id="fg-${attId}"]`).first()
  }

  async getAttendeesFieldLabel() {
    return (await this.getAttendeesFieldFormGroup())
      .locator(`label[for="${attId}"]`)
      .first()
  }

  async getAttendeesField() {
    return (await this.getAttendeesFieldFormGroup())
      .locator(`input[id="${attId}"]`)
      .first()
  }

  async getAttendeesFieldAdvancedSelectFirstItem() {
    return currentPage()
      .locator(
        `div[id="${attId}-popover"] tbody tr:first-child td:nth-child(2)`
      )
      .first()
  }

  async getAttendeesFieldValue() {
    return (await this.getAttendeesFieldFormGroup())
      .locator(`div[id="${attId}Container"] .interlocutorAttendeesTable`)
      .first()
  }

  async getAttendeesFieldValueRow(n) {
    return (await this.getAttendeesFieldValue())
      .locator(`tbody tr:nth-child(${n})`)
      .first()
  }

  async getTasksFieldFormGroup() {
    return currentPage().locator(`div[id="fg-${tskId}"]`).first()
  }

  async getTasksFieldLabel() {
    return (await this.getTasksFieldFormGroup())
      .locator(`label[for="${tskId}"]`)
      .first()
  }

  async getTasksField() {
    return (await this.getTasksFieldFormGroup())
      .locator(`input[id="${tskId}"]`)
      .first()
  }

  async getTasksFieldAdvancedSelectItem(rowNumber = 2) {
    return currentPage()
      .locator(
        `div[id="${tskId}-popover"] tbody tr:nth-child(${rowNumber}) td:nth-child(2)`
      )
      .first()
  }

  async getTasksFieldValue() {
    return (await this.getTasksFieldFormGroup())
      .locator(`div[id="${tskId}-${tskId}"]`)
      .first()
  }

  async getTasksFieldValueRow(n) {
    return (await this.getTasksFieldValue())
      .locator(`tbody tr:nth-child(${n})`)
      .first()
  }

  async getDeleteButton() {
    return currentPage()
      .locator('//button[text()="Delete this planned engagement"]')
      .first()
  }

  async open() {
    await super.open(PAGE_URL, "selena")
  }
}
export default new CreateFutureReport()
