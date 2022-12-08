import moment from "moment"
import * as cr from "../createReport.page"

class CreateReport extends cr.CreateReport {
  get title() {
    return browser.$("h4.legend")
  }

  get intent() {
    return browser.$("#intent")
  }

  get intentHelpBlock() {
    return browser.$("#fg-intent div.invalid-feedback")
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

  get reportPeopleTable() {
    return browser.$("#reportPeople-popover .table-responsive table")
  }

  get location() {
    return browser.$('#fg-location input[id="location"]')
  }

  get locationTable() {
    return browser.$("#location-popover .table-responsive table")
  }

  get atmosphere() {
    return browser.$("#fg-atmosphere")
  }

  get atmospherePositive() {
    return this.atmosphere.$('label[for="atmosphere_POSITIVE"]')
  }

  get atmosphereNeutral() {
    return this.atmosphere.$('label[for="atmosphere_NEUTRAL"]')
  }

  get atmosphereNegative() {
    return this.atmosphere.$('label[for="atmosphere_NEGATIVE"]')
  }

  get keyOutcomes() {
    return browser.$('#fg-keyOutcomes textarea[id="keyOutcomes"]')
  }

  get nextSteps() {
    return browser.$('#fg-nextSteps textarea[id="nextSteps"]')
  }

  get reportText() {
    return browser.$("#fg-reportText .editable")
  }

  getPersonByName(name) {
    const personRow = browser.$$(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td[@class="conflictButton" or @class="reportPeopleName"]`
    )
    personRow[0].$("div.bp3-spinner").waitForExist({ reverse: true })

    return {
      name: personRow[1].getText(),
      conflictButton: personRow[0].$("./span")
    }
  }

  selectAttendeeByName(name) {
    this.reportPeople.click()
    // wait for reportPeople table loader to disappear
    this.reportPeopleTable.waitForDisplayed()
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

  get tasksTable() {
    return browser.$("#tasks-popover .table-responsive table")
  }

  selectTaskByName(name) {
    this.tasks.click()
    // wait for tasks table loader to disappear
    this.tasksTable.waitForDisplayed()
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

  selectLocation(location) {
    this.location.click()
    browser.keys(location)
    this.locationTable.waitForDisplayed()
    const checkBox = this.locationTable.$(
      "tbody tr:first-child td:first-child input.form-check-input"
    )
    if (!checkBox.isSelected()) {
      checkBox.click()
    }
  }

  selectAthosphere(option) {
    switch (option) {
      case "Positive":
        this.atmospherePositive.click()
        break

      case "Neutral":
        this.atmospherePositive.click()
        break

      case "Negative":
        this.atmospherePositive.click()
        break

      default:
        break
    }
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

    if (fields.location) {
      this.selectLocation(fields.location)
    }

    if (fields.atmosphere) {
      this.selectAthosphere(fields.atmosphere)
    }

    if (Array.isArray(fields.advisors) && fields.advisors.length) {
      fields.advisors.forEach(at => this.selectAttendeeByName(at))
    }

    if (Array.isArray(fields.principals) && fields.principals.length) {
      fields.principals.forEach(at => this.selectAttendeeByName(at))
    }

    if (Array.isArray(fields.tasks) && fields.tasks.length) {
      fields.tasks.forEach(t => this.selectTaskByName(t))
    }

    if (fields.keyOutcomes) {
      this.keyOutcomes.setValue(fields.keyOutcomes)
    }

    if (fields.nextSteps) {
      this.nextSteps.setValue(fields.nextSteps)
    }

    if (fields.reportText) {
      this.reportText.click()
      browser.keys(fields.reportText)
    }
  }
}

export default new CreateReport()
