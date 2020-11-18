import moment from "moment"
import Page from "../page"

const PAGE_URL = "/reports/new"

class CreateReport extends Page {
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

  get today() {
    return browser.$(".bp3-datepicker-footer > button:first-child")
  }

  get tomorrow() {
    const tomorrow = moment().add(1, "day").format("ddd MMM DD YYYY")
    return browser.$(`div[aria-label="${tomorrow}"]`)
  }

  get hour() {
    return browser.$("input.bp3-timepicker-input.bp3-timepicker-hour")
  }

  get minute() {
    return browser.$("input.bp3-timepicker-input.bp3-timepicker-minute")
  }

  get duration() {
    return browser.$("#duration")
  }

  get reportPeople() {
    return browser.$("#reportPeople")
  }

  get reportPeopleTable() {
    return browser.$("#reportPeople-popover .table-responsive table")
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  open() {
    super.open(PAGE_URL)
  }

  getAdvisorByName(name) {
    const advisor = browser
      .$$("#reportPeopleContainer .advisorAttendeesTable tbody tr")
      .find(r => {
        return (
          r.$("td.reportPeopleName").isExisting() &&
          r.$("td.reportPeopleName").getText() === name
        )
      })

    if (!advisor) {
      return null
    }
    // wait for conflict loader to disappear
    advisor
      .$("td.conflictButton div.bp3-spinner")
      .waitForExist({ reverse: true })

    const result = {
      name: advisor.$("td.reportPeopleName").getText(),
      conflictButton: advisor.$("td.conflictButton > span")
    }

    return result
  }

  getPrincipalByName(name) {
    // principals table has an empty row at top
    const principal = browser
      .$$("#reportPeopleContainer .principalAttendeesTable tbody tr")
      .find(
        r =>
          r.$("td.reportPeopleName").isExisting() &&
          r.$("td.reportPeopleName").getText() === name
      )
    if (!principal) {
      return null
    }
    // wait for conflict loader to disappear
    principal
      .$("td.conflictButton div.bp3-spinner")
      .waitForExist({ reverse: true })

    return {
      name: principal.$("td.reportPeopleName").getText(),
      conflictButton: principal.$("td.conflictButton > span")
    }
  }

  selectAttendeeByName(name) {
    this.reportPeople.click()
    // wait for attendess table loader to disappear
    this.reportPeopleTable.waitForDisplayed()
    let searchTerm = name
    if (searchTerm.startsWith("CIV") || searchTerm.startsWith("Maj")) {
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
    this.reportPeopleTable.waitForDisplayed({ reverse: true })
  }

  fillForm(fields) {
    this.form.waitForClickable()

    if (fields.intent !== undefined) {
      this.intent.setValue(fields.intent)
    }

    this.intentHelpBlock.waitForExist({ reverse: true })

    if (moment.isMoment(fields.engagementDate)) {
      this.engagementDate.waitForClickable()
      this.engagementDate.click()
      this.tomorrow.waitForDisplayed()
      this.tomorrow.waitForClickable()
      browser.pause(300) // wait for calendar popup animation
      this.tomorrow.click()
      browser.waitUntil(() => !!browser.$("#engagementDate").getValue())
      this.hour.waitForDisplayed()
      this.hour.waitForClickable()
      this.hour.click()
      browser.keys(fields.engagementDate.format("HH"))
      this.minute.waitForDisplayed()
      this.minute.waitForClickable()
      this.minute.click()
      browser.keys(fields.engagementDate.format("mm"))
      this.engagementDate.click()

      this.title.click()
      this.tomorrow.waitForDisplayed({ reverse: true })
    }

    if (fields.duration !== undefined) {
      this.duration.setValue(fields.duration)
    }

    if (Array.isArray(fields.advisors) && fields.advisors.length) {
      fields.advisors.forEach(at => this.selectAttendeeByName(at))
    }

    if (Array.isArray(fields.principals) && fields.principals.length) {
      fields.principals.forEach(at => this.selectAttendeeByName(at))
    }
  }

  submitForm() {
    this.submitButton.click()
  }
}

export default new CreateReport()
