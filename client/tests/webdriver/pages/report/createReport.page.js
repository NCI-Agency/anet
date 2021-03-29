import moment from "moment"
import * as cr from "../createReport.page"

const SHORT_WAIT_MS = 1000

class CreateReport extends cr.CreateReport {
  get form() {
    return browser.$("form")
  }

  get title() {
    return browser.$("h2.legend")
  }

  get intent() {
    return browser.$("#intent")
  }

  get intentHelpBlock() {
    return browser.$("#fg-intent .help-block")
  }

  get engagementDate() {
    return browser.$("#engagementDate")
  }

  get tomorrow() {
    const tomorrow = moment().add(1, "day").format("ddd MMM DD YYYY")
    return browser.$(`div[aria-label="${tomorrow}"]`)
  }

  get reportPeople() {
    return browser.$("#reportPeople")
  }

  get reportPeopleFilters() {
    return browser.$("#reportPeople-popover .advanced-select-filters")
  }

  get reportPeopleTable() {
    return browser.$("#reportPeople-popover .table-responsive table")
  }

  selectReportPeopleFilter(filterIndex) {
    const filter = this.reportPeopleFilters.$(
      `li:nth-child(${filterIndex}) button`
    )
    filter.waitForClickable()
    filter.click()
    browser.pause(SHORT_WAIT_MS) // give the advanced select some time to apply the filter
    this.reportPeople.click()
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  getPersonByName(name) {
    const personRow = browser.$$(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and ./a[text()="${name}"]]]/td[@class="conflictButton" or @class="reportPeopleName"]`
    )
    personRow[0].$("div.bp3-spinner").waitForExist({ reverse: true })

    return {
      name: personRow[1].getText(),
      conflictButton: personRow[0].$("./span")
    }
  }

  selectAttendeeByName(name, filterIndex) {
    this.reportPeople.click()
    // wait for reportPeople table loader to disappear
    this.reportPeopleFilters.waitForDisplayed()
    if (filterIndex) {
      // select filter
      this.selectReportPeopleFilter(filterIndex)
    }
    let searchTerm = name
    if (
      searchTerm.startsWith("CIV") ||
      searchTerm.startsWith("LtCol") ||
      searchTerm.startsWith("Maj")
    ) {
      searchTerm = name.substr(name.indexOf(" ") + 1)
    }
    browser.keys(searchTerm)
    this.reportPeopleTable.waitForDisplayed()
    const checkBox = this.reportPeopleTable.$(
      "tbody tr:first-child td:first-child input.checkbox"
    )
    if (!checkBox.isSelected()) {
      checkBox.click()
    }
    this.title.click()
    this.reportPeopleTable.waitForExist({ reverse: true, timeout: 3000 })
  }

  get tasks() {
    return browser.$("#tasks")
  }

  get tasksFilters() {
    return browser.$("#tasks-popover .advanced-select-filters")
  }

  get tasksTable() {
    return browser.$("#tasks-popover .table-responsive table")
  }

  selectTasksFilter(filterIndex) {
    const filter = this.tasksFilters.$(`li:nth-child(${filterIndex}) button`)
    filter.waitForClickable()
    filter.click()
    browser.pause(SHORT_WAIT_MS) // give the advanced select some time to apply the filter
    this.tasks.click()
  }

  selectTaskByName(name, filterIndex) {
    this.tasks.click()
    // wait for tasks table loader to disappear
    this.tasksFilters.waitForDisplayed()
    if (filterIndex) {
      // select filter
      this.selectTasksFilter(filterIndex)
    }
    browser.keys(name)
    this.tasksTable.waitForDisplayed()
    const checkBox = this.tasksTable.$(
      "tbody tr:first-child td:first-child input.checkbox"
    )
    if (!checkBox.isSelected()) {
      checkBox.click()
    }
    this.title.click()
    this.tasksTable.waitForExist({ reverse: true, timeout: 3000 })
  }

  fillForm(fields) {
    this.form.waitForClickable()

    if (fields.intent !== undefined) {
      this.intent.setValue(fields.intent)
      this.intentHelpBlock.waitForExist({ reverse: true })
    }

    if (moment.isMoment(fields.engagementDate)) {
      this.engagementDate.waitForClickable()
      this.engagementDate.click()
      this.tomorrow.waitForDisplayed()
      browser.keys(fields.engagementDate.format("DD-MM-YYYY HH:mm"))

      this.title.click()
      this.tomorrow.waitForExist({ reverse: true, timeout: 3000 })
    }

    if (fields.duration !== undefined) {
      this.duration.setValue(fields.duration)
    }

    if (Array.isArray(fields.advisors) && fields.advisors.length) {
      fields.advisors.forEach(at => this.selectAttendeeByName(at, 2))
    }

    if (Array.isArray(fields.principals) && fields.principals.length) {
      fields.principals.forEach(at => this.selectAttendeeByName(at, 2))
    }

    if (Array.isArray(fields.tasks) && fields.tasks.length) {
      fields.tasks.forEach(t => this.selectTaskByName(t, 2))
    }
  }
}

export default new CreateReport()
