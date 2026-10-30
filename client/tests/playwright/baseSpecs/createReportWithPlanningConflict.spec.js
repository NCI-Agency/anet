import { expect, test } from "@playwright/test"
import moment from "moment"
import CreateReportPageObject from "../pages/report/createReport.page.js"
import EditReportPageObject from "../pages/report/editReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"

test.describe(() => {
  let page, CreateReport, EditReport, ShowReport
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    CreateReport = new CreateReportPageObject(page)
    EditReport = new EditReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
  })
  test("When creating a Report with conflicts", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 9)

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
    await test.step(
      "Should create first draft report without any conflicts",
      async () => {
        await CreateReport.open()
        // wait for the page transition and rendering of custom fields
        await CreateReport.fillForm(report01)
        await expect(await CreateReport.getIntent()).toHaveValue(
          report01.intent
        )
        await expect(await CreateReport.getEngagementDate()).toHaveValue(
          report01.engagementDate.format("DD-MM-YYYY HH:mm")
        )
        await expect(await CreateReport.getDuration()).toHaveValue(
          report01.duration
        )
        const advisor01 = await CreateReport.getPersonByName("CIV Erin Erinson")
        expect(advisor01.name).toBe("CIV Erin Erinson")
        await expect(advisor01.conflictButton).toHaveCount(0)
        const advisor02 = await CreateReport.getPersonByName(
          report01.advisors[0]
        )
        expect(advisor02.name).toBe(report01.advisors[0])
        await expect(advisor02.conflictButton).toHaveCount(0)
        const interlocutor01 = await CreateReport.getPersonByName(
          report01.interlocutors[0]
        )
        expect(interlocutor01.name).toBe(report01.interlocutors[0])
        await expect(interlocutor01.conflictButton).toHaveCount(0)
        await CreateReport.submitForm()
        await ShowReport.waitForShowReportToLoad()
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_PLANNED_DRAFT,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getIntent()).toHaveText(report01.intent, {
          useInnerText: true
        })
        firstReportUUID = await ShowReport.getUuid()
        expect(firstReportUUID.length).toBe(36)
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should create second draft report with conflicts",
      async () => {
        await CreateReport.open()
        // wait for the page transition and rendering of custom fields
        await CreateReport.fillForm(report02)
        await expect(await CreateReport.getIntent()).toHaveValue(
          report02.intent
        )
        await expect(await CreateReport.getEngagementDate()).toHaveValue(
          report02.engagementDate.format("DD-MM-YYYY HH:mm")
        )
        await expect(await CreateReport.getDuration()).toHaveValue(
          report02.duration
        )
        const advisor01 = await CreateReport.getPersonByName("CIV Erin Erinson")
        expect(advisor01.name).toBe("CIV Erin Erinson")
        await expect(advisor01.conflictButton).not.toHaveCount(0)
        const advisor02 = await CreateReport.getPersonByName(
          report02.advisors[0]
        )
        expect(advisor02.name).toBe(report02.advisors[0])
        await expect(advisor02.conflictButton).not.toHaveCount(0)
        const advisor03 = await CreateReport.getPersonByName(
          report02.advisors[1]
        )
        expect(advisor03.name).toBe(report02.advisors[1])
        await expect(advisor03.conflictButton).toHaveCount(0)
        const interlocutor01 = await CreateReport.getPersonByName(
          report02.interlocutors[0]
        )
        expect(interlocutor01.name).toBe(report02.interlocutors[0])
        await expect(interlocutor01.conflictButton).not.toHaveCount(0)
        const interlocutor02 = await CreateReport.getPersonByName(
          report02.interlocutors[1]
        )
        expect(interlocutor02.name).toBe(report02.interlocutors[1])
        await expect(interlocutor02.conflictButton).toHaveCount(0)
        await CreateReport.submitForm()
        await ShowReport.waitForShowReportToLoad()
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_PLANNED_DRAFT,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getIntent()).toHaveText(report02.intent, {
          useInnerText: true
        })
        secondReportUUID = await ShowReport.getUuid()
        expect(secondReportUUID.length).toBe(36)
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should display first report with conflicts",
      async () => {
        await ShowReport.open(firstReportUUID)
        await ShowReport.waitForShowReportToLoad()
        expect((await ShowReport.getUuid()).length).toBe(36)
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_PLANNED_DRAFT,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getIntent()).toHaveText(report01.intent, {
          useInnerText: true
        })
        await expect(await ShowReport.getEngagementDate()).toHaveText(
          report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"),
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getReportConflictIcon()).not.toHaveCount(
          0
        )
        await (await ShowReport.getReportConflictIcon()).hover()
        await expect(
          await ShowReport.getReportConflictTooltipTitle()
        ).toHaveText("3 of 3 attendees are busy at the selected time!", {
          useInnerText: true
        })
        await expect(await ShowReport.getDuration()).toHaveText(
          report01.duration,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getLocation()).toHaveText("Unspecified", {
          useInnerText: true
        })
        await expect(await ShowReport.getAuthors()).toHaveText(
          /CIV Erin Erinson/,
          {
            useInnerText: true
          }
        )
        const advisor01 = await ShowReport.getAttendeeByName("CIV Erin Erinson")
        expect(advisor01.name).toBe("CIV Erin Erinson")
        await expect(advisor01.conflictButton).not.toHaveCount(0)
        await expect(advisor01.conflictButton).toContainText(/conflict/, {
          useInnerText: true
        })
        const advisor02 = await ShowReport.getAttendeeByName(
          report01.advisors[0]
        )
        expect(advisor02.name).toBe(report01.advisors[0])
        await expect(advisor02.conflictButton).not.toHaveCount(0)
        await expect(advisor02.conflictButton).toContainText(/conflict/, {
          useInnerText: true
        })
        const interlocutor01 = await ShowReport.getAttendeeByName(
          report01.interlocutors[0]
        )
        expect(interlocutor01.name).toBe(report01.interlocutors[0])
        await expect(interlocutor01.conflictButton).not.toHaveCount(0)
        await expect(interlocutor01.conflictButton).toContainText(/conflict/, {
          useInnerText: true
        })
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should display second report with conflicts",
      async () => {
        await ShowReport.open(secondReportUUID)
        await ShowReport.waitForShowReportToLoad()
        expect((await ShowReport.getUuid()).length).toBe(36)
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_PLANNED_DRAFT,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getIntent()).toHaveText(report02.intent, {
          useInnerText: true
        })
        await expect(await ShowReport.getEngagementDate()).toHaveText(
          report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"),
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getReportConflictIcon()).not.toHaveCount(
          0
        )
        await (await ShowReport.getReportConflictIcon()).hover()
        // Depending on the order of the tests, the number of conflicts may vary
        await expect(
          await ShowReport.getReportConflictTooltipTitle()
        ).toHaveText(/(3|5) of 5 attendees are busy at the selected time!/, {
          useInnerText: true
        })
        await expect(await ShowReport.getDuration()).toHaveText(
          report02.duration,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getLocation()).toHaveText("Unspecified", {
          useInnerText: true
        })
        await expect(await ShowReport.getAuthors()).toHaveText(
          /CIV Erin Erinson/,
          {
            useInnerText: true
          }
        )
        const advisor01 = await ShowReport.getAttendeeByName("CIV Erin Erinson")
        expect(advisor01.name).toBe("CIV Erin Erinson")
        await expect(advisor01.conflictButton).not.toHaveCount(0)
        await expect(advisor01.conflictButton).toContainText(/conflict/, {
          useInnerText: true
        })
        const advisor02 =
          await ShowReport.getAttendeeByName("CIV Ima Reportgirl")
        await expect(advisor02.conflictButton).toHaveCount(0)
        const advisor03 =
          await ShowReport.getAttendeeByName("CIV Ima Reportguy")
        await expect(advisor03.conflictButton).not.toHaveCount(0)
        await expect(advisor03.conflictButton).toContainText(/conflict/, {
          useInnerText: true
        })
        const interlocutor01 =
          await ShowReport.getAttendeeByName("CIV Kyle Kyleson")
        await expect(interlocutor01.conflictButton).not.toHaveCount(0)
        await expect(interlocutor01.conflictButton).toContainText(/conflict/, {
          useInnerText: true
        })
        const interlocutor02 = await ShowReport.getAttendeeByName(
          "OF-3 Chris Chrisville"
        )
        await expect(interlocutor02.conflictButton).toHaveCount(0)
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should delete the first report",
      async () => {
        await EditReport.open(firstReportUUID)
        await EditReport.deleteReport(firstReportUUID, true)
        await expect(await EditReport.getAlertSuccess()).toHaveText(
          "Report deleted",
          {
            useInnerText: true
          }
        )
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should delete the second report",
      async () => {
        await EditReport.open(secondReportUUID)
        await EditReport.deleteReport(secondReportUUID, true)
        await expect(await EditReport.getAlertSuccess()).toHaveText(
          "Report deleted",
          {
            useInnerText: true
          }
        )
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should create third report without conflicts",
      async () => {
        await CreateReport.open()
        // wait for the page transition and rendering of custom fields
        // this engagement overlaps with a cancelled engagement from the SQL data
        await CreateReport.fillForm(report03)
        await expect(await CreateReport.getIntent()).toHaveValue(
          report03.intent
        )
        await expect(await CreateReport.getEngagementDate()).toHaveValue(
          report03.engagementDate.format("DD-MM-YYYY HH:mm")
        )
        const advisor01 = await CreateReport.getPersonByName("CIV Erin Erinson")
        expect(advisor01.name).toBe("CIV Erin Erinson")
        await expect(advisor01.conflictButton).toHaveCount(0)
        await CreateReport.submitForm()
        await ShowReport.waitForShowReportToLoad()
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_DRAFT,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getIntent()).toHaveText(report03.intent, {
          useInnerText: true
        })
        thirdReportUUID = await ShowReport.getUuid()
        expect(thirdReportUUID.length).toBe(36)
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should display third report without conflicts",
      async () => {
        await ShowReport.open(thirdReportUUID)
        await ShowReport.waitForShowReportToLoad()
        expect((await ShowReport.getUuid()).length).toBe(36)
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_DRAFT,
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getIntent()).toHaveText(report03.intent, {
          useInnerText: true
        })
        await expect(await ShowReport.getEngagementDate()).toHaveText(
          report03.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"),
          {
            useInnerText: true
          }
        )
        await expect(await ShowReport.getReportConflictIcon()).toHaveCount(0)
        const advisor01 = await ShowReport.getAttendeeByName("CIV Erin Erinson")
        expect(advisor01.name).toBe("CIV Erin Erinson")
        await expect(advisor01.conflictButton).toHaveCount(0)
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should delete the third report",
      async () => {
        await EditReport.open(thirdReportUUID)
        await EditReport.deleteReport(thirdReportUUID, false)
        await expect(await EditReport.getAlertSuccess()).toHaveText(
          "Report deleted",
          {
            useInnerText: true
          }
        )
      },
      { timeout: stepTimeout }
    )
  })
})
