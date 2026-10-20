import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import moment from "moment"
import CreateReport from "../pages/report/createReport.page.js"
import EditReport from "../pages/report/editReport.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import { test } from "../support.js"

test.describe("When creating a Report with conflicts", () => {
  let firstReportUUID
  let secondReportUUID
  let thirdReportUUID
  const report01 = {
    intent: "111111111111",
    engagementDate: moment()
      .add(1, "day")
      .hours(1)
      .minutes(0)
      .seconds(0)
      .milliseconds(0),
    duration: "60",
    advisors: ["CIV Ima Reportguy"],
    interlocutors: ["CIV Kyle Kyleson"]
  }
  const report02 = {
    intent: "2222222222",
    engagementDate: moment()
      .add(1, "day")
      .hours(1)
      .minutes(10)
      .seconds(0)
      .milliseconds(0),
    duration: "10",
    advisors: ["CIV Ima Reportguy", "CIV Ima Reportgirl"],
    interlocutors: ["CIV Kyle Kyleson", "OF-3 Chris Chrisville"]
  }
  const report03 = {
    intent: "333333333333",
    engagementDate: moment()
  }
  test("Should create first draft report without any conflicts", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(report01)
    await pwExpect(await CreateReport.getIntent()).toHaveValue(report01.intent)
    await pwExpect(await CreateReport.getEngagementDate()).toHaveValue(
      report01.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    await pwExpect(await CreateReport.getDuration()).toHaveValue(
      report01.duration
    )
    const advisor01 = await CreateReport.getPersonByName("CIV Erin Erinson")
    expect(advisor01.name).to.equal("CIV Erin Erinson")
    await pwExpect(advisor01.conflictButton).toHaveCount(0)
    const advisor02 = await CreateReport.getPersonByName(report01.advisors[0])
    expect(advisor02.name).to.equal(report01.advisors[0])
    await pwExpect(advisor02.conflictButton).toHaveCount(0)
    const interlocutor01 = await CreateReport.getPersonByName(
      report01.interlocutors[0]
    )
    expect(interlocutor01.name).to.equal(report01.interlocutors[0])
    await pwExpect(interlocutor01.conflictButton).toHaveCount(0)
    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()
    await pwExpect
      .poll(async () => await ShowReport.getReportStatusText())
      .toEqual(ShowReport.REPORT_IS_PLANNED_DRAFT)
    await pwExpect
      .poll(async () => await ShowReport.getIntent())
      .toEqual(report01.intent)
    firstReportUUID = await ShowReport.getUuid()
    expect(firstReportUUID.length).to.equal(36)
  })
  test("Should create second draft report with conflicts", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(report02)
    await pwExpect(await CreateReport.getIntent()).toHaveValue(report02.intent)
    await pwExpect(await CreateReport.getEngagementDate()).toHaveValue(
      report02.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    await pwExpect(await CreateReport.getDuration()).toHaveValue(
      report02.duration
    )
    const advisor01 = await CreateReport.getPersonByName("CIV Erin Erinson")
    expect(advisor01.name).to.equal("CIV Erin Erinson")
    await pwExpect(advisor01.conflictButton).not.toHaveCount(0)
    const advisor02 = await CreateReport.getPersonByName(report02.advisors[0])
    expect(advisor02.name).to.equal(report02.advisors[0])
    await pwExpect(advisor02.conflictButton).not.toHaveCount(0)
    const advisor03 = await CreateReport.getPersonByName(report02.advisors[1])
    expect(advisor03.name).to.equal(report02.advisors[1])
    await pwExpect(advisor03.conflictButton).toHaveCount(0)
    const interlocutor01 = await CreateReport.getPersonByName(
      report02.interlocutors[0]
    )
    expect(interlocutor01.name).to.equal(report02.interlocutors[0])
    await pwExpect(interlocutor01.conflictButton).not.toHaveCount(0)
    const interlocutor02 = await CreateReport.getPersonByName(
      report02.interlocutors[1]
    )
    expect(interlocutor02.name).to.equal(report02.interlocutors[1])
    await pwExpect(interlocutor02.conflictButton).toHaveCount(0)
    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()
    await pwExpect
      .poll(async () => await ShowReport.getReportStatusText())
      .toEqual(ShowReport.REPORT_IS_PLANNED_DRAFT)
    await pwExpect
      .poll(async () => await ShowReport.getIntent())
      .toEqual(report02.intent)
    secondReportUUID = await ShowReport.getUuid()
    expect(secondReportUUID.length).to.equal(36)
  })
  test("Should display first report with conflicts", async () => {
    await ShowReport.open(firstReportUUID)
    await ShowReport.waitForShowReportToLoad()
    expect((await ShowReport.getUuid()).length).to.equal(36)
    await pwExpect
      .poll(async () => await ShowReport.getReportStatusText())
      .toEqual(ShowReport.REPORT_IS_PLANNED_DRAFT)
    await pwExpect
      .poll(async () => await ShowReport.getIntent())
      .toEqual(report01.intent)
    await pwExpect
      .poll(async () => await ShowReport.getEngagementDate())
      .toEqual(report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"))
    await pwExpect(await ShowReport.getReportConflictIcon()).not.toHaveCount(0)
    await (await ShowReport.getReportConflictIcon()).hover()
    await pwExpect
      .poll(async () => await ShowReport.getReportConflictTooltipTitle())
      .toEqual("3 of 3 attendees are busy at the selected time!")
    await pwExpect
      .poll(async () => await ShowReport.getDuration())
      .toEqual(report01.duration)
    await pwExpect
      .poll(async () => await ShowReport.getLocation())
      .toEqual("Unspecified")
    expect(await ShowReport.getAuthors()).to.match(/CIV Erin Erinson/)
    const advisor01 = await ShowReport.getAttendeeByName("CIV Erin Erinson")
    expect(advisor01.name).to.equal("CIV Erin Erinson")
    await pwExpect(advisor01.conflictButton).not.toHaveCount(0)
    await pwExpect(advisor01.conflictButton).toContainText(/conflict/, {
      useInnerText: true
    })
    const advisor02 = await ShowReport.getAttendeeByName(report01.advisors[0])
    expect(advisor02.name).to.equal(report01.advisors[0])
    await pwExpect(advisor02.conflictButton).not.toHaveCount(0)
    await pwExpect(advisor02.conflictButton).toContainText(/conflict/, {
      useInnerText: true
    })
    const interlocutor01 = await ShowReport.getAttendeeByName(
      report01.interlocutors[0]
    )
    expect(interlocutor01.name).to.equal(report01.interlocutors[0])
    await pwExpect(interlocutor01.conflictButton).not.toHaveCount(0)
    await pwExpect(interlocutor01.conflictButton).toContainText(/conflict/, {
      useInnerText: true
    })
  })
  test("Should display second report with conflicts", async () => {
    await ShowReport.open(secondReportUUID)
    await ShowReport.waitForShowReportToLoad()
    expect((await ShowReport.getUuid()).length).to.equal(36)
    await pwExpect
      .poll(async () => await ShowReport.getReportStatusText())
      .toEqual(ShowReport.REPORT_IS_PLANNED_DRAFT)
    await pwExpect
      .poll(async () => await ShowReport.getIntent())
      .toEqual(report02.intent)
    await pwExpect
      .poll(async () => await ShowReport.getEngagementDate())
      .toEqual(report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"))
    await pwExpect(await ShowReport.getReportConflictIcon()).not.toHaveCount(0)
    await (await ShowReport.getReportConflictIcon()).hover()
    // Depending on the order of the tests, the number of conflicts may vary
    expect(await ShowReport.getReportConflictTooltipTitle()).to.match(
      /(3|5) of 5 attendees are busy at the selected time!/
    )
    await pwExpect
      .poll(async () => await ShowReport.getDuration())
      .toEqual(report02.duration)
    await pwExpect
      .poll(async () => await ShowReport.getLocation())
      .toEqual("Unspecified")
    expect(await ShowReport.getAuthors()).to.match(/CIV Erin Erinson/)
    const advisor01 = await ShowReport.getAttendeeByName("CIV Erin Erinson")
    expect(advisor01.name).to.equal("CIV Erin Erinson")
    await pwExpect(advisor01.conflictButton).not.toHaveCount(0)
    await pwExpect(advisor01.conflictButton).toContainText(/conflict/, {
      useInnerText: true
    })
    const advisor02 = await ShowReport.getAttendeeByName("CIV Ima Reportgirl")
    await pwExpect(advisor02.conflictButton).toHaveCount(0)
    const advisor03 = await ShowReport.getAttendeeByName("CIV Ima Reportguy")
    await pwExpect(advisor03.conflictButton).not.toHaveCount(0)
    await pwExpect(advisor03.conflictButton).toContainText(/conflict/, {
      useInnerText: true
    })
    const interlocutor01 =
      await ShowReport.getAttendeeByName("CIV Kyle Kyleson")
    await pwExpect(interlocutor01.conflictButton).not.toHaveCount(0)
    await pwExpect(interlocutor01.conflictButton).toContainText(/conflict/, {
      useInnerText: true
    })
    const interlocutor02 = await ShowReport.getAttendeeByName(
      "OF-3 Chris Chrisville"
    )
    await pwExpect(interlocutor02.conflictButton).toHaveCount(0)
  })
  test("Should delete the first report", async () => {
    await EditReport.open(firstReportUUID)
    await EditReport.deleteReport(firstReportUUID, true)
    await pwExpect(await EditReport.getAlertSuccess()).toHaveText(
      "Report deleted",
      {
        useInnerText: true
      }
    )
  })
  test("Should delete the second report", async () => {
    await EditReport.open(secondReportUUID)
    await EditReport.deleteReport(secondReportUUID, true)
    await pwExpect(await EditReport.getAlertSuccess()).toHaveText(
      "Report deleted",
      {
        useInnerText: true
      }
    )
  })
  test("Should create third report without conflicts", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    // this engagement overlaps with a cancelled engagement from the SQL data
    await CreateReport.fillForm(report03)
    await pwExpect(await CreateReport.getIntent()).toHaveValue(report03.intent)
    await pwExpect(await CreateReport.getEngagementDate()).toHaveValue(
      report03.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    const advisor01 = await CreateReport.getPersonByName("CIV Erin Erinson")
    expect(advisor01.name).to.equal("CIV Erin Erinson")
    await pwExpect(advisor01.conflictButton).toHaveCount(0)
    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()
    await pwExpect
      .poll(async () => await ShowReport.getReportStatusText())
      .toEqual(ShowReport.REPORT_IS_DRAFT)
    await pwExpect
      .poll(async () => await ShowReport.getIntent())
      .toEqual(report03.intent)
    thirdReportUUID = await ShowReport.getUuid()
    expect(thirdReportUUID.length).to.equal(36)
  })
  test("Should display third report without conflicts", async () => {
    await ShowReport.open(thirdReportUUID)
    await ShowReport.waitForShowReportToLoad()
    expect((await ShowReport.getUuid()).length).to.equal(36)
    await pwExpect
      .poll(async () => await ShowReport.getReportStatusText())
      .toEqual(ShowReport.REPORT_IS_DRAFT)
    await pwExpect
      .poll(async () => await ShowReport.getIntent())
      .toEqual(report03.intent)
    await pwExpect
      .poll(async () => await ShowReport.getEngagementDate())
      .toEqual(report03.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"))
    await pwExpect(await ShowReport.getReportConflictIcon()).toHaveCount(0)
    const advisor01 = await ShowReport.getAttendeeByName("CIV Erin Erinson")
    expect(advisor01.name).to.equal("CIV Erin Erinson")
    await pwExpect(advisor01.conflictButton).toHaveCount(0)
  })
  test("Should delete the third report", async () => {
    await EditReport.open(thirdReportUUID)
    await EditReport.deleteReport(thirdReportUUID, false)
    await pwExpect(await EditReport.getAlertSuccess()).toHaveText(
      "Report deleted",
      {
        useInnerText: true
      }
    )
  })
})
