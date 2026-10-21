import { expect } from "@playwright/test"
import moment from "moment"
import { currentPage, typeKeys, waitFor } from "../../support.js"
import * as cr from "../createReport.page.js"

class CreateReport extends cr.CreateReport {
  async getTitle() {
    return currentPage().locator("h4.legend").first()
  }

  async getIntent() {
    return currentPage().locator("#intent").first()
  }

  async getIntentHelpBlock() {
    return currentPage().locator("#fg-intent div.invalid-feedback").first()
  }

  async getEngagementDate() {
    return currentPage().locator("#engagementDate").first()
  }

  async getDatepicker() {
    return currentPage().locator("#fg-engagementDate .bp6-datepicker").first()
  }

  async getTodayButton() {
    return (await this.getDatepicker())
      .locator('xpath=.//button/span[text()="Today"]')
      .first()
  }

  async getReportCommunities() {
    return currentPage().locator("#reportCommunities").first()
  }

  async getReportCommunitiesTable() {
    return currentPage()
      .locator("#reportCommunities-popover .table-responsive table")
      .first()
  }

  async getReportPeople() {
    return currentPage().locator("#reportPeople").first()
  }

  async getReportPeopleTable() {
    return currentPage()
      .locator("#reportPeople-popover .table-responsive table")
      .first()
  }

  async getLocation() {
    return currentPage().locator('#fg-location input[id="location"]').first()
  }

  async getLocationTable() {
    return currentPage()
      .locator("#location-popover .table-responsive table")
      .first()
  }

  async getAtmosphere() {
    return currentPage().locator("#fg-atmosphere").first()
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
    return currentPage()
      .locator('#fg-keyOutcomes textarea[id="keyOutcomes"]')
      .first()
  }

  async getNextSteps() {
    return currentPage()
      .locator('#fg-nextSteps textarea[id="nextSteps"]')
      .first()
  }

  async getReportText() {
    return currentPage().locator("#fg-reportText .editable").first()
  }

  async getEvent() {
    return currentPage().locator('#fg-event input[id="event"]').first()
  }

  async getEventTable() {
    return currentPage()
      .locator("#event-popover .table-responsive table")
      .first()
  }

  async selectReportCommunityByName(name) {
    await (await this.getReportCommunities()).click()
    // wait for table loader to disappear
    await waitFor(await this.getReportCommunitiesTable(), "visible")
    await typeKeys(name)
    await waitFor(await this.getReportCommunitiesTable(), "visible")
    const checkBox = await (
      await this.getReportCommunitiesTable()
    )
      .locator("tbody tr:first-child td:first-child input.checkbox")
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await waitFor(await this.getReportCommunitiesTable(), "attached", {
      reverse: true,
      timeout: 3000
    })
  }

  async getAttendeeColumns(name) {
    const columns = currentPage().locator(
      `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td`
    )
    await expect(columns.nth(5)).toBeAttached()
    return columns.all()
  }

  async getPersonByName(name) {
    const personRow = await currentPage()
      .locator(
        `//div[@id="reportPeopleContainer"]//tr[td[@class="reportPeopleName" and .//a[text()="${name}"]]]/td[@class="primary-attendee" or @class="conflictButton" or @class="reportPeopleName"]`
      )
      .all()
    await waitFor(
      await personRow[0].locator("div.bp6-spinner").first(),
      "attached",
      {
        reverse: true
      }
    )
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
    await waitFor(await this.getReportPeopleTable(), "visible")
    let searchTerm = name
    if (
      (await searchTerm.startsWith("CIV")) ||
      (await searchTerm.startsWith("OF-4")) ||
      (await searchTerm.startsWith("OF-3")) ||
      (await searchTerm.startsWith("OF-2"))
    ) {
      searchTerm = name.substr(name.indexOf(" ") + 1)
    }
    await typeKeys(searchTerm)
    await waitFor(await this.getReportPeopleTable(), "visible")
    const checkBox = await (
      await this.getReportPeopleTable()
    )
      .locator("tbody tr:first-child td:first-child input.checkbox")
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await waitFor(await this.getReportPeopleTable(), "attached", {
      reverse: true,
      timeout: 3000
    })
  }

  async getTasks() {
    return currentPage().locator("#tasks").first()
  }

  async getTaskSearchPopover() {
    return currentPage().locator("#tasks-popover").first()
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
    await waitFor(await this.getTasksTable(), "visible")
    await typeKeys(name)
    await waitFor(await this.getTasksTable(), "visible")
    const checkBox = await (
      await this.getTasksTable()
    )
      .locator(`tbody tr:nth-child(${rowNumber}) td:first-child input.checkbox`)
      .first()
    if (!(await checkBox.isChecked())) {
      await checkBox.click()
    }
    await (await this.getTitle()).click()
    await waitFor(await this.getTaskSearchPopover(), "attached", {
      reverse: true,
      timeout: 3000
    })
  }

  async selectLocation(location, rowNumber = 2) {
    await (await this.getLocation()).click()
    await typeKeys(location)
    await waitFor(await this.getLocationTable(), "visible")
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
    await typeKeys(event)
    await waitFor(await this.getEventTable(), "visible")
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
    await waitFor(await this.getTodayButton(), "visible")
    await this.deleteInput(this.getEngagementDate())
    await typeKeys(engagementDate.format("DD-MM-YYYY HH:mm"))
  }

  async fillForm(fields) {
    await waitFor(await this.getForm(), "clickable")
    if (fields.intent !== undefined) {
      await (await this.getIntent()).fill(String(fields.intent))
      await waitFor(await this.getIntentHelpBlock(), "attached", {
        reverse: true
      })
    }
    if (moment.isMoment(fields.engagementDate)) {
      await this.setEngagementDate(fields.engagementDate)
      await (await this.getTitle()).click()
      await waitFor(await this.getDatepicker(), "attached", {
        reverse: true,
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
      await typeKeys(fields.reportText)
    }
    if (fields.event) {
      await this.selectEvent(fields.event)
    }
  }
}

export default new CreateReport()
