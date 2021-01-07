import { CreateReport } from "./createReport.page"

const PAGE_URL = "/reports/new"

const attId = "reportPeople"
const tskId = "tasks"

class CreateFutureReport extends CreateReport {
  get engagementDate() {
    return browser.$('input[id="engagementDate"]')
  }

  get attendeesFieldFormGroup() {
    return browser.$(`div[id="fg-${attId}"]`)
  }

  get attendeesFieldLabel() {
    return this.attendeesFieldFormGroup.$(`label[for="${attId}"]`)
  }

  get attendeesField() {
    return this.attendeesFieldFormGroup.$(`input[id="${attId}"]`)
  }

  get attendeesFieldAdvancedSelectFirstItem() {
    return this.attendeesFieldFormGroup.$(
      `div[id="${attId}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  get attendeesFieldValue() {
    return this.attendeesFieldFormGroup.$(
      `div[id="${attId}Container"] .principalAttendeesTable`
    )
  }

  getAttendeesFieldValueRow(n) {
    return this.attendeesFieldValue.$(`tbody tr:nth-child(${n})`)
  }

  get tasksFieldFormGroup() {
    return browser.$(`div[id="fg-${tskId}"]`)
  }

  get tasksFieldLabel() {
    return this.tasksFieldFormGroup.$(`label[for="${tskId}"]`)
  }

  get tasksField() {
    return this.tasksFieldFormGroup.$(`input[id="${tskId}"]`)
  }

  get tasksFieldAdvancedSelectFirstItem() {
    return this.tasksFieldFormGroup.$(
      `div[id="${tskId}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  get tasksFieldValue() {
    return this.tasksFieldFormGroup.$(`div[id="${tskId}-${tskId}"]`)
  }

  getTasksFieldValueRow(n) {
    return this.tasksFieldValue.$(`tbody tr:nth-child(${n})`)
  }

  get deleteButton() {
    return browser.$('//button[text()="Delete this planned engagement"]')
  }

  open() {
    super.open(PAGE_URL, "selena")
  }
}

export default new CreateFutureReport()
