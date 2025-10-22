import { CreateReport } from "./createReport.page"

const PAGE_URL = "/reports/new"

const attId = "reportPeople"
const tskId = "tasks"

class CreateFutureReport extends CreateReport {
  async getEngagementDate() {
    return browser.$('input[id="engagementDate"]')
  }

  async getAttendeesFieldFormGroup() {
    return browser.$(`div[id="fg-${attId}"]`)
  }

  async getAttendeesFieldLabel() {
    return (await this.getAttendeesFieldFormGroup()).$(`label[for="${attId}"]`)
  }

  async getAttendeesField() {
    return (await this.getAttendeesFieldFormGroup()).$(`input[id="${attId}"]`)
  }

  async getAttendeesFilter(filterIndex = 1) {
    return browser.$(
      `div[id="${attId}-popover"] .advanced-select-filters li:nth-child(${filterIndex}) button`
    )
  }

  async getAttendeesFieldAdvancedSelectFirstItem() {
    return browser.$(
      `div[id="${attId}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  async getAttendeesFieldValue() {
    return (await this.getAttendeesFieldFormGroup()).$(
      `div[id="${attId}Container"] .interlocutorAttendeesTable`
    )
  }

  async getAttendeesFieldValueRow(n) {
    return (await this.getAttendeesFieldValue()).$(`tbody tr:nth-child(${n})`)
  }

  async getTasksFieldFormGroup() {
    return browser.$(`div[id="fg-${tskId}"]`)
  }

  async getTasksFieldLabel() {
    return (await this.getTasksFieldFormGroup()).$(`label[for="${tskId}"]`)
  }

  async getTasksField() {
    return (await this.getTasksFieldFormGroup()).$(`input[id="${tskId}"]`)
  }

  async getTasksFilter(filterIndex = 1) {
    return browser.$(
      `div[id="${tskId}-popover"] .advanced-select-filters li:nth-child(${filterIndex}) button`
    )
  }

  async getTasksFieldAdvancedSelectItem(rowNumber = 2) {
    return browser.$(
      `div[id="${tskId}-popover"] tbody tr:nth-child(${rowNumber}) td:nth-child(2)`
    )
  }

  async getTasksFieldValue() {
    return (await this.getTasksFieldFormGroup()).$(
      `div[id="${tskId}-${tskId}"]`
    )
  }

  async getTasksFieldValueRow(n) {
    return (await this.getTasksFieldValue()).$(`tbody tr:nth-child(${n})`)
  }

  async getDeleteButton() {
    return browser.$('//button[text()="Delete this planned engagement"]')
  }

  async open() {
    await super.open(PAGE_URL, "selena")
  }
}

export default new CreateFutureReport()
