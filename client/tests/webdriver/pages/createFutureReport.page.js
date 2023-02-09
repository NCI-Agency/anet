import { CreateReport } from "./createReport.page"

const PAGE_URL = "/reports/new"

const attId = "reportPeople"
const tskId = "tasks"

class CreateFutureReport extends CreateReport {
  getEngagementDate() {
    return browser.$('input[id="engagementDate"]')
  }

  getAttendeesFieldFormGroup() {
    return browser.$(`div[id="fg-${attId}"]`)
  }

  getAttendeesFieldLabel() {
    return this.getAttendeesFieldFormGroup().$(`label[for="${attId}"]`)
  }

  getAttendeesField() {
    return this.getAttendeesFieldFormGroup().$(`input[id="${attId}"]`)
  }

  getAttendeesFieldAdvancedSelectFirstItem() {
    return this.getAttendeesFieldFormGroup().$(
      `div[id="${attId}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  getAttendeesFieldValue() {
    return this.getAttendeesFieldFormGroup().$(
      `div[id="${attId}Container"] .principalAttendeesTable`
    )
  }

  getAttendeesFieldValueRow(n) {
    return this.getAttendeesFieldValue().$(`tbody tr:nth-child(${n})`)
  }

  getAttendeesAssessments() {
    return browser.$("#attendees-engagement-assessments")
  }

  getAttendeeAssessment(name) {
    return this.getAttendeesAssessments().$(`//td//a[text()="${name}"]`)
  }

  getTasksFieldFormGroup() {
    return browser.$(`div[id="fg-${tskId}"]`)
  }

  getTasksFieldLabel() {
    return this.getTasksFieldFormGroup().$(`label[for="${tskId}"]`)
  }

  getTasksField() {
    return this.getTasksFieldFormGroup().$(`input[id="${tskId}"]`)
  }

  getTasksFieldAdvancedSelectFirstItem() {
    return this.getTasksFieldFormGroup().$(
      `div[id="${tskId}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  getTasksFieldValue() {
    return this.getTasksFieldFormGroup().$(`div[id="${tskId}-${tskId}"]`)
  }

  getTasksFieldValueRow(n) {
    return this.getTasksFieldValue().$(`tbody tr:nth-child(${n})`)
  }

  getTasksAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  getTaskAssessment(shortName) {
    return this.getTasksAssessments().$(`//td//a[text()="${shortName}"]`)
  }

  getDeleteButton() {
    return browser.$('//button[text()="Delete this planned engagement"]')
  }

  open() {
    super.open(PAGE_URL, "selena")
  }
}

export default new CreateFutureReport()
