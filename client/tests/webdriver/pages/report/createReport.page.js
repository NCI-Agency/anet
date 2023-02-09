import moment from "moment"
import * as cr from "../createReport.page"

class CreateReport extends cr.CreateReport {
  getTitle() {
    return browser.$("h4.legend")
  }

  getIntent() {
    return browser.$("#intent")
  }

  getIntentHelpBlock() {
    return browser.$("#fg-intent div.invalid-feedback")
  }

  getEngagementDate() {
    return browser.$("#engagementDate")
  }

  getTomorrow() {
    const tomorrow = moment().add(1, "day").format("ddd MMM DD YYYY")
    return browser.$(`div[aria-label="${tomorrow}"]`)
  }

  getReportPeople() {
    return browser.$("#reportPeople")
  }

  getReportPeopleTable() {
    return browser.$("#reportPeople-popover .table-responsive table")
  }

  getLocation() {
    return browser.$('#fg-location input[id="location"]')
  }

  getLocationTable() {
    return browser.$("#location-popover .table-responsive table")
  }

  getAtmosphere() {
    return browser.$("#fg-atmosphere")
  }

  getAtmospherePositive() {
    return this.getAtmosphere().$('label[for="atmosphere_POSITIVE"]')
  }

  getAtmosphereNeutral() {
    return this.getAtmosphere().$('label[for="atmosphere_NEUTRAL"]')
  }

  getAtmosphereNegative() {
    return this.getAtmosphere().$('label[for="atmosphere_NEGATIVE"]')
  }

  getKeyOutcomes() {
    return browser.$('#fg-keyOutcomes textarea[id="keyOutcomes"]')
  }

  getNextSteps() {
    return browser.$('#fg-nextSteps textarea[id="nextSteps"]')
  }

  getReportText() {
    return browser.$("#fg-reportText .editable")
  }

  getPersonByName(name) {
    const personRow = browser.$$(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td[@class="conflictButton" or @class="reportPeopleName"]`
    )
    personRow[0].$("div.bp4-spinner").waitForExist({ reverse: true })

    return {
      name: personRow[1].getText(),
      conflictButton: personRow[0].$("./span")
    }
  }

  selectAttendeeByName(name) {
    this.getReportPeople().click()
    // wait for reportPeople table loader to disappear
    this.getReportPeopleTable().waitForDisplayed()
    let searchTerm = name
    if (
      searchTerm.startsWith("CIV") ||
      searchTerm.startsWith("LtCol") ||
      searchTerm.startsWith("Maj")
    ) {
      searchTerm = name.substr(name.indexOf(" ") + 1)
    }
    browser.keys(searchTerm)
    this.getReportPeopleTable().waitForDisplayed()
    const checkBox = this.getReportPeopleTable().$(
      "tbody tr:first-child td:first-child input.checkbox"
    )
    if (!checkBox.isSelected()) {
      checkBox.click()
    }
    this.getTitle().click()
    this.getReportPeopleTable().waitForExist({ reverse: true, timeout: 3000 })
  }

  getTasks() {
    return browser.$("#tasks")
  }

  getTasksTable() {
    return browser.$("#tasks-popover .table-responsive table")
  }

  selectTaskByName(name) {
    this.getTasks().click()
    // wait for tasks table loader to disappear
    this.getTasksTable().waitForDisplayed()
    browser.keys(name)
    this.getTasksTable().waitForDisplayed()
    const checkBox = this.getTasksTable().$(
      "tbody tr:first-child td:first-child input.checkbox"
    )
    if (!checkBox.isSelected()) {
      checkBox.click()
    }
    this.getTitle().click()
    this.getTasksTable().waitForExist({ reverse: true, timeout: 3000 })
  }

  selectLocation(location) {
    this.getLocation().click()
    browser.keys(location)
    this.getLocationTable().waitForDisplayed()
    const checkBox = this.getLocationTable().$(
      "tbody tr:first-child td:first-child input.form-check-input"
    )
    if (!checkBox.isSelected()) {
      checkBox.click()
    }
  }

  selectAthosphere(option) {
    switch (option) {
      case "Positive":
        this.getAtmospherePositive().click()
        break

      case "Neutral":
        this.getAtmospherePositive().click()
        break

      case "Negative":
        this.getAtmospherePositive().click()
        break

      default:
        break
    }
  }

  fillForm(fields) {
    this.getForm().waitForClickable()

    if (fields.intent !== undefined) {
      this.getIntent().setValue(fields.intent)
      this.getIntentHelpBlock().waitForExist({ reverse: true })
    }

    if (moment.isMoment(fields.engagementDate)) {
      this.getEngagementDate().waitForClickable()
      this.getEngagementDate().click()
      this.getTomorrow().waitForDisplayed()
      browser.keys(fields.engagementDate.format("DD-MM-YYYY HH:mm"))

      this.getTitle().click()
      this.getTomorrow().waitForExist({ reverse: true, timeout: 3000 })
    }

    if (fields.duration !== undefined) {
      this.getDuration().setValue(fields.duration)
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
      this.getKeyOutcomes().setValue(fields.keyOutcomes)
    }

    if (fields.nextSteps) {
      this.getNextSteps().setValue(fields.nextSteps)
    }

    if (fields.reportText) {
      this.getReportText().click()
      browser.keys(fields.reportText)
    }
  }
}

export default new CreateReport()
