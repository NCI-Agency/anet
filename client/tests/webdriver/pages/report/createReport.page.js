import moment from "moment"
import * as cr from "../createReport.page"

class CreateReport extends cr.CreateReport {
  async getTitle() {
    return browser.$("h4.legend")
  }

  async getIntent() {
    return browser.$("#intent")
  }

  async getIntentHelpBlock() {
    return browser.$("#fg-intent div.invalid-feedback")
  }

  async getEngagementDate() {
    return browser.$("#engagementDate")
  }

  async getDatepicker() {
    return browser.$("#fg-engagementDate .bp6-datepicker")
  }

  async getTodayButton() {
    return (await this.getDatepicker()).$('.//button/span[text()="Today"]')
  }

  async getReportPeople() {
    return browser.$("#reportPeople")
  }

  async getReportPeopleTable() {
    return browser.$("#reportPeople-popover .table-responsive table")
  }

  async getLocation() {
    return browser.$('#fg-location input[id="location"]')
  }

  async getLocationTable() {
    return browser.$("#location-popover .table-responsive table")
  }

  async getAtmosphere() {
    return browser.$("#fg-atmosphere")
  }

  async getAtmospherePositive() {
    return (await this.getAtmosphere()).$('label[for="atmosphere_POSITIVE"]')
  }

  async getAtmosphereNeutral() {
    return (await this.getAtmosphere()).$('label[for="atmosphere_NEUTRAL"]')
  }

  async getAtmosphereNegative() {
    return (await this.getAtmosphere()).$('label[for="atmosphere_NEGATIVE"]')
  }

  async getKeyOutcomes() {
    return browser.$('#fg-keyOutcomes textarea[id="keyOutcomes"]')
  }

  async getNextSteps() {
    return browser.$('#fg-nextSteps textarea[id="nextSteps"]')
  }

  async getReportText() {
    return browser.$("#fg-reportText .editable")
  }

  async getAttendeeColumns(name) {
    return browser.$$(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td`
    )
  }

  async getPersonByName(name) {
    const personRow = await browser.$$(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td[@class="primary-attendee" or @class="conflictButton" or @class="reportPeopleName"]`
    )
    await (
      await personRow[0].$("div.bp6-spinner")
    ).waitForExist({ reverse: true })

    return {
      name: await personRow[2].getText(),
      conflictButton: await personRow[1].$("./span"),
      advisorCheckbox: await personRow[0].$(
        "input[name='reportInterlocutorADVISOR']"
      ),
      interlocutorCheckbox: await personRow[0].$(
        "input[name='reportInterlocutorINTERLOCUTOR']"
      )
    }
  }

  async selectAttendeeByName(name) {
    await (await this.getReportPeople()).click()
    // wait for reportPeople table loader to disappear
    await (await this.getReportPeopleTable()).waitForDisplayed()
    let searchTerm = name
    if (
      (await searchTerm.startsWith("CIV")) ||
      (await searchTerm.startsWith("OF-4")) ||
      (await searchTerm.startsWith("OF-3")) ||
      (await searchTerm.startsWith("OF-2"))
    ) {
      searchTerm = name.substr(name.indexOf(" ") + 1)
    }
    await browser.keys(searchTerm)
    await (await this.getReportPeopleTable()).waitForDisplayed()
    const checkBox = await (
      await this.getReportPeopleTable()
    ).$("tbody tr:first-child td:first-child input.checkbox")
    if (!(await checkBox.isSelected())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await (
      await this.getReportPeopleTable()
    ).waitForExist({ reverse: true, timeout: 3000 })
  }

  async getTasks() {
    return browser.$("#tasks")
  }

  async getTaskSearchPopover() {
    return browser.$("#tasks-popover")
  }

  async getTaskSearchFilters() {
    return (await this.getTaskSearchPopover()).$(".advanced-select-filters")
  }

  async getTasksTable() {
    return (await this.getTaskSearchPopover()).$(".table-responsive table")
  }

  async getAllUnassignedTasksFilterButton() {
    return (await this.getTaskSearchFilters()).$(
      ".btn-link=All unassigned Objectives"
    )
  }

  async selectTaskByName(name, rowNumber = 2) {
    await (await this.getTasks()).click()
    // wait for tasks table loader to disappear
    await (await this.getTasksTable()).waitForDisplayed()
    await browser.keys(name)
    await (await this.getTasksTable()).waitForDisplayed()
    const checkBox = await (
      await this.getTasksTable()
    ).$(`tbody tr:nth-child(${rowNumber}) td:first-child input.checkbox`)
    if (!(await checkBox.isSelected())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await (
      await this.getTasksTable()
    ).waitForExist({ reverse: true, timeout: 3000 })
  }

  async selectLocation(location, rowNumber = 2) {
    await (await this.getLocation()).click()
    await browser.keys(location)
    await (await this.getLocationTable()).waitForDisplayed()
    const checkBox = await (
      await this.getLocationTable()
    ).$(
      `tbody tr:nth-child(${rowNumber}) td:first-child input.form-check-input`
    )
    if (!(await checkBox.isSelected())) {
      await checkBox.click()
    }
  }

  async selectAthosphere(option) {
    switch (option) {
      case "Positive":
        await (await this.getAtmospherePositive()).click()
        break

      case "Neutral":
        await (await this.getAtmospherePositive()).click()
        break

      case "Negative":
        await (await this.getAtmospherePositive()).click()
        break

      default:
        break
    }
  }

  async setEngagementDate(engagementDate) {
    await (await this.getEngagementDate()).waitForClickable()
    await (await this.getEngagementDate()).click()
    await (await this.getTodayButton()).waitForDisplayed()
    await this.deleteInput(this.getEngagementDate())
    await browser.keys(engagementDate.format("DD-MM-YYYY HH:mm"))
  }

  async fillForm(fields) {
    await (await this.getForm()).waitForClickable()

    if (fields.intent !== undefined) {
      await (await this.getIntent()).setValue(fields.intent)
      await (await this.getIntentHelpBlock()).waitForExist({ reverse: true })
    }

    if (moment.isMoment(fields.engagementDate)) {
      await this.setEngagementDate(fields.engagementDate)
      await (await this.getTitle()).click()
      await (
        await this.getDatepicker()
      ).waitForExist({ reverse: true, timeout: 3000 })
    }

    if (fields.duration !== undefined) {
      await (await this.getDuration()).setValue(fields.duration)
    }

    if (fields.location) {
      await this.selectLocation(fields.location)
    }

    if (fields.atmosphere) {
      await this.selectAthosphere(fields.atmosphere)
    }

    if (Array.isArray(fields.advisors) && fields.advisors.length) {
      for (const at of fields.advisors) {
        await this.selectAttendeeByName(at)
      }
    }

    if (Array.isArray(fields.interlocutors) && fields.interlocutors.length) {
      for (const at of fields.interlocutors) {
        await this.selectAttendeeByName(at)
      }
    }

    if (Array.isArray(fields.tasks) && fields.tasks.length) {
      for (const t of fields.tasks) {
        await this.selectTaskByName(t.name, t.rowNumber)
      }
    }

    if (fields.keyOutcomes) {
      await (await this.getKeyOutcomes()).scrollIntoView()
      await (await this.getKeyOutcomes()).setValue(fields.keyOutcomes)
    }

    if (fields.nextSteps) {
      await (await this.getNextSteps()).scrollIntoView()
      await (await this.getNextSteps()).setValue(fields.nextSteps)
    }

    if (fields.reportText) {
      await (await this.getReportText()).scrollIntoView()
      await (await this.getReportText()).click()
      await browser.keys(fields.reportText)
    }
  }
}

export default new CreateReport()
