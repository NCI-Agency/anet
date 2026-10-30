import { expect } from "@playwright/test"
import moment from "moment"
import * as cr from "../createReport.page.js"

class CreateReport extends cr.CreateReport {
  async getTitle() {
    return this.page.locator("h4.legend").first()
  }

  async getIntent() {
    return this.page.locator("#intent").first()
  }

  async getIntentHelpBlock() {
    return this.page.locator("#fg-intent div.invalid-feedback").first()
  }

  async getEngagementDate() {
    return this.page.locator("#engagementDate").first()
  }

  async getDatepicker() {
    return this.page.locator("#fg-engagementDate .bp6-datepicker").first()
  }

  async getTodayButton() {
    return (await this.getDatepicker())
      .locator('xpath=.//button/span[text()="Today"]')
      .first()
  }

  async getReportCommunities() {
    return this.page.locator("#reportCommunities").first()
  }

  async getReportCommunitiesTable() {
    return this.page
      .locator("#reportCommunities-popover .table-responsive table")
      .first()
  }

  async getReportPeople() {
    return this.page.locator("#reportPeople").first()
  }

  async getReportPeopleTable() {
    return this.page
      .locator("#reportPeople-popover .table-responsive table")
      .first()
  }

  async getLocation() {
    return this.page.locator('#fg-location input[id="location"]').first()
  }

  async getLocationTable() {
    return this.page
      .locator("#location-popover .table-responsive table")
      .first()
  }

  async getAtmosphere() {
    return this.page.locator("#fg-atmosphere").first()
  }

  async getAtmospherePositive() {
    return (await this.getAtmosphere())
      .locator('label[for="atmosphere_POSITIVE"]')
      .first()
  }

  async getAtmosphereNeutral() {
    return (await this.getAtmosphere())
      .locator('label[for="atmosphere_NEUTRAL"]')
      .first()
  }

  async getAtmosphereNegative() {
    return (await this.getAtmosphere())
      .locator('label[for="atmosphere_NEGATIVE"]')
      .first()
  }

  async getKeyOutcomes() {
    return this.page
      .locator('#fg-keyOutcomes textarea[id="keyOutcomes"]')
      .first()
  }

  async getNextSteps() {
    return this.page.locator('#fg-nextSteps textarea[id="nextSteps"]').first()
  }

  async getReportText() {
    return this.page.locator("#fg-reportText .editable").first()
  }

  async getEvent() {
    return this.page.locator('#fg-event input[id="event"]').first()
  }

  async getEventTable() {
    return this.page.locator("#event-popover .table-responsive table").first()
  }

  async selectReportCommunityByName(name) {
    await (await this.getReportCommunities()).click()
    // wait for table loader to disappear
    await (
      await this.getReportCommunitiesTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await this.page.keyboard.insertText(String(name))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await (
      await this.getReportCommunitiesTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    const checkBox = await (
      await this.getReportCommunitiesTable()
    )
      .locator("tbody tr:first-child td:first-child input.checkbox")
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await (
      await this.getReportCommunitiesTable()
    ).waitFor({
      state: "detached",
      timeout: 3000
    })
  }

  async getAttendeeColumns(name) {
    const columns = this.page.locator(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td`
    )
    await expect(columns.nth(5)).toBeAttached()
    return columns.all()
  }

  async getPersonByName(name) {
    const personRow = await this.page
      .locator(
        `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td[@class="primary-attendee" or @class="conflictButton" or @class="reportPeopleName"]`
      )
      .all()
    await (
      await personRow[0].locator("div.bp6-spinner").first()
    ).waitFor({
      state: "detached",
      timeout: 10000
    })
    return {
      name: (await personRow[2].innerText()).trim(),
      conflictButton: await personRow[1].locator("xpath=./span").first(),
      advisorCheckbox: await personRow[0]
        .locator("input[name='reportInterlocutorADVISOR']")
        .first(),
      interlocutorCheckbox: await personRow[0]
        .locator("input[name='reportInterlocutorINTERLOCUTOR']")
        .first()
    }
  }

  async selectAttendeeByName(name) {
    await (await this.getReportPeople()).click()
    // wait for reportPeople table loader to disappear
    await (
      await this.getReportPeopleTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    let searchTerm = name
    if (
      (await searchTerm.startsWith("CIV")) ||
      (await searchTerm.startsWith("OF-4")) ||
      (await searchTerm.startsWith("OF-3")) ||
      (await searchTerm.startsWith("OF-2"))
    ) {
      searchTerm = name.substr(name.indexOf(" ") + 1)
    }
    await this.page.keyboard.insertText(String(searchTerm))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await (
      await this.getReportPeopleTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    const checkBox = await (
      await this.getReportPeopleTable()
    )
      .locator("tbody tr:first-child td:first-child input.checkbox")
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await (
      await this.getReportPeopleTable()
    ).waitFor({
      state: "detached",
      timeout: 3000
    })
  }

  async getTasks() {
    return this.page.locator("#tasks").first()
  }

  async getTaskSearchPopover() {
    return this.page.locator("#tasks-popover").first()
  }

  async getTaskSearchFilters() {
    return (await this.getTaskSearchPopover())
      .locator(".advanced-select-filters")
      .first()
  }

  async getTasksTable() {
    return (await this.getTaskSearchPopover())
      .locator(".table-responsive table")
      .first()
  }

  async getAllUnassignedTasksFilterButton() {
    return (await this.getTaskSearchFilters())
      .locator(".btn-link")
      .filter({
        hasText: "All unassigned Objectives"
      })
      .first()
  }

  async selectTaskByName(name, rowNumber = 2) {
    await (await this.getTasks()).click()
    // wait for tasks table loader to disappear
    await (
      await this.getTasksTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await this.page.keyboard.insertText(String(name))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await (
      await this.getTasksTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    const checkBox = await (
      await this.getTasksTable()
    )
      .locator(`tbody tr:nth-child(${rowNumber}) td:first-child input.checkbox`)
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await (
      await this.getTaskSearchPopover()
    ).waitFor({
      state: "detached",
      timeout: 3000
    })
  }

  async selectLocation(location, rowNumber = 2) {
    await (await this.getLocation()).click()
    await this.page.keyboard.insertText(String(location))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await (
      await this.getLocationTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    const checkBox = await (
      await this.getLocationTable()
    )
      .locator(
        `tbody tr:nth-child(${rowNumber}) td:first-child input.form-check-input`
      )
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
  }

  async selectEvent(event, rowNumber = 1) {
    await (await this.getEvent()).click()
    await this.page.keyboard.insertText(String(event))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await (
      await this.getEventTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    const checkBox = await (
      await this.getEventTable()
    )
      .locator(
        `tbody tr:nth-child(${rowNumber}) td:first-child input.form-check-input`
      )
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
  }

  async selectAtmosphere(option) {
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
    await (await this.getEngagementDate()).click()
    await (
      await this.getTodayButton()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await this.deleteInput(this.getEngagementDate())
    await this.page.keyboard.insertText(
      String(engagementDate.format("DD-MM-YYYY HH:mm"))
    )
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
  }

  async fillForm(fields) {
    await expect(await this.getForm()).toBeVisible({
      timeout: 10000
    })
    await expect(await this.getForm()).toBeEnabled({
      timeout: 10000
    })
    if (fields.intent !== undefined) {
      await (await this.getIntent()).fill(String(fields.intent))
      await (
        await this.getIntentHelpBlock()
      ).waitFor({
        state: "detached",
        timeout: 10000
      })
    }
    if (moment.isMoment(fields.engagementDate)) {
      await this.setEngagementDate(fields.engagementDate)
      await (await this.getTitle()).click()
      await (
        await this.getDatepicker()
      ).waitFor({
        state: "detached",
        timeout: 3000
      })
    }
    if (fields.duration !== undefined) {
      await (await this.getDuration()).fill(String(fields.duration))
    }
    if (fields.location) {
      await this.selectLocation(fields.location)
    }
    if (fields.atmosphere) {
      await this.selectAtmosphere(fields.atmosphere)
    }
    if (
      Array.isArray(fields.reportCommunities) &&
      fields.reportCommunities.length
    ) {
      for (const rc of fields.reportCommunities) {
        await this.selectReportCommunityByName(rc)
      }
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
      await (await this.getKeyOutcomes()).scrollIntoViewIfNeeded()
      await (await this.getKeyOutcomes()).fill(String(fields.keyOutcomes))
    }
    if (fields.nextSteps) {
      await (await this.getNextSteps()).scrollIntoViewIfNeeded()
      await (await this.getNextSteps()).fill(String(fields.nextSteps))
    }
    if (fields.reportText) {
      await (await this.getReportText()).scrollIntoViewIfNeeded()
      await (await this.getReportText()).click()
      await this.page.keyboard.insertText(String(fields.reportText))
      const focused = this.page.locator(":focus")
      if ((await focused.getAttribute("contenteditable")) === "true") {
        await focused.blur()
      }
    }
    if (fields.event) {
      await this.selectEvent(fields.event)
    }
  }
}
export default CreateReport
