import { expect } from "chai"
import moment from "moment"
import CreateReport from "../pages/report/createReport.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"

describe("When creating a Report with conflicts", () => {
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
    advisors: ["CIV REPORTGUY, Ima"],
    interlocutors: ["CIV KYLESON, Kyle"]
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
    advisors: ["CIV REPORTGUY, Ima", "CIV REPORTGIRL, Ima"],
    interlocutors: ["CIV KYLESON, Kyle", "OF-3 CHRISVILLE, Chris"]
  }
  const report03 = {
    intent: "333333333333",
    engagementDate: moment()
  }

  it("Should create first draft report without any conflicts", async () => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(report01)

    expect(await (await CreateReport.getIntent()).getValue()).to.equal(
      report01.intent
    )
    expect(await (await CreateReport.getEngagementDate()).getValue()).to.equal(
      report01.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    expect(await (await CreateReport.getDuration()).getValue()).to.equal(
      report01.duration
    )
    const advisor01 = await CreateReport.getPersonByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(await advisor01.conflictButton.isExisting()).to.equal(false)

    const advisor02 = await CreateReport.getPersonByName(report01.advisors[0])
    expect(advisor02.name).to.equal(report01.advisors[0])
    expect(await advisor02.conflictButton.isExisting()).to.equal(false)

    const interlocutor01 = await CreateReport.getPersonByName(
      report01.interlocutors[0]
    )
    expect(interlocutor01.name).to.equal(report01.interlocutors[0])
    expect(await interlocutor01.conflictButton.isExisting()).to.equal(false)

    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()

    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_PLANNED_DRAFT
    )
    expect(await ShowReport.getIntent()).to.equal(report01.intent)

    firstReportUUID = await ShowReport.getUuid()
    expect(firstReportUUID.length).to.equal(36)
  })

  it("Should create second draft report with conflicts", async () => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(report02)

    expect(await (await CreateReport.getIntent()).getValue()).to.equal(
      report02.intent
    )
    expect(await (await CreateReport.getEngagementDate()).getValue()).to.equal(
      report02.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    expect(await (await CreateReport.getDuration()).getValue()).to.equal(
      report02.duration
    )
    const advisor01 = await CreateReport.getPersonByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(await advisor01.conflictButton.isExisting()).to.equal(true)

    const advisor02 = await CreateReport.getPersonByName(report02.advisors[0])
    expect(advisor02.name).to.equal(report02.advisors[0])
    expect(await advisor02.conflictButton.isExisting()).to.equal(true)

    const advisor03 = await CreateReport.getPersonByName(report02.advisors[1])
    expect(advisor03.name).to.equal(report02.advisors[1])
    expect(await advisor03.conflictButton.isExisting()).to.equal(false)

    const interlocutor01 = await CreateReport.getPersonByName(
      report02.interlocutors[0]
    )
    expect(interlocutor01.name).to.equal(report02.interlocutors[0])
    expect(await interlocutor01.conflictButton.isExisting()).to.equal(true)

    const interlocutor02 = await CreateReport.getPersonByName(
      report02.interlocutors[1]
    )
    expect(interlocutor02.name).to.equal(report02.interlocutors[1])
    expect(await interlocutor02.conflictButton.isExisting()).to.equal(false)

    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()

    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_PLANNED_DRAFT
    )
    expect(await ShowReport.getIntent()).to.equal(report02.intent)

    secondReportUUID = await ShowReport.getUuid()
    expect(secondReportUUID.length).to.equal(36)
  })

  it("Should display first report with conflicts", async () => {
    await ShowReport.open(firstReportUUID)
    await ShowReport.waitForShowReportToLoad()

    expect((await ShowReport.getUuid()).length).to.equal(36)
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_PLANNED_DRAFT
    )
    expect(await ShowReport.getIntent()).to.equal(report01.intent)
    expect(await ShowReport.getEngagementDate()).to.equal(
      report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    expect(
      await (await ShowReport.getReportConflictIcon()).isExisting()
    ).to.equal(true)

    await (await ShowReport.getReportConflictIcon()).moveTo()
    expect(await ShowReport.getReportConflictTooltipTitle()).to.equal(
      "3 of 3 attendees are busy at the selected time!"
    )

    expect(await ShowReport.getDuration()).to.equal(report01.duration)
    expect(await ShowReport.getLocation()).to.equal("Unspecified")
    expect(await ShowReport.getAuthors()).to.match(/CIV ERINSON, Erin/)

    const advisor01 = await ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(await advisor01.conflictButton.isExisting()).to.equal(true)
    expect(await advisor01.conflictButton.getText()).to.match(/conflict/)

    const advisor02 = await ShowReport.getAttendeeByName(report01.advisors[0])
    expect(advisor02.name).to.equal(report01.advisors[0])
    expect(await advisor02.conflictButton.isExisting()).to.equal(true)
    expect(await advisor02.conflictButton.getText()).to.match(/conflict/)

    const interlocutor01 = await ShowReport.getAttendeeByName(
      report01.interlocutors[0]
    )
    expect(interlocutor01.name).to.equal(report01.interlocutors[0])
    expect(await interlocutor01.conflictButton.isExisting()).to.equal(true)
    expect(await interlocutor01.conflictButton.getText()).to.match(/conflict/)
  })

  it("Should display second report with conflicts", async () => {
    await ShowReport.open(secondReportUUID)
    await ShowReport.waitForShowReportToLoad()

    expect((await ShowReport.getUuid()).length).to.equal(36)
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_PLANNED_DRAFT
    )
    expect(await ShowReport.getIntent()).to.equal(report02.intent)
    expect(await ShowReport.getEngagementDate()).to.equal(
      report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    expect(
      await (await ShowReport.getReportConflictIcon()).isExisting()
    ).to.equal(true)

    await (await ShowReport.getReportConflictIcon()).moveTo()
    // Depending on the order of the tests, the number of conflicts may vary
    expect(await ShowReport.getReportConflictTooltipTitle()).to.match(
      /(3|5) of 5 attendees are busy at the selected time!/
    )

    expect(await ShowReport.getDuration()).to.equal(report02.duration)
    expect(await ShowReport.getLocation()).to.equal("Unspecified")
    expect(await ShowReport.getAuthors()).to.match(/CIV ERINSON, Erin/)

    const advisor01 = await ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(await advisor01.conflictButton.isExisting()).to.equal(true)
    expect(await advisor01.conflictButton.getText()).to.match(/conflict/)

    const advisor02 = await ShowReport.getAttendeeByName("CIV REPORTGIRL, Ima")
    expect(await advisor02.conflictButton.isExisting()).to.equal(false)

    const advisor03 = await ShowReport.getAttendeeByName("CIV REPORTGUY, Ima")
    expect(await advisor03.conflictButton.isExisting()).to.equal(true)
    expect(await advisor03.conflictButton.getText()).to.match(/conflict/)

    const interlocutor01 =
      await ShowReport.getAttendeeByName("CIV KYLESON, Kyle")
    expect(await interlocutor01.conflictButton.isExisting()).to.equal(true)
    expect(await interlocutor01.conflictButton.getText()).to.match(/conflict/)

    const interlocutor02 = await ShowReport.getAttendeeByName(
      "OF-3 CHRISVILLE, Chris"
    )
    expect(await interlocutor02.conflictButton.isExisting()).to.equal(false)
  })

  it("Should delete the first report", async () => {
    await EditReport.open(firstReportUUID)
    await EditReport.deleteReport(firstReportUUID, true)

    expect(await (await EditReport.getAlertSuccess()).getText()).to.equal(
      "Report deleted"
    )
  })

  it("Should delete the second report", async () => {
    await EditReport.open(secondReportUUID)
    await EditReport.deleteReport(secondReportUUID, true)

    expect(await (await EditReport.getAlertSuccess()).getText()).to.equal(
      "Report deleted"
    )
  })

  it("Should create third report without conflicts", async () => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    // this engagement overlaps with a cancelled engagement from the SQL data
    await CreateReport.fillForm(report03)

    expect(await (await CreateReport.getIntent()).getValue()).to.equal(
      report03.intent
    )
    expect(await (await CreateReport.getEngagementDate()).getValue()).to.equal(
      report03.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    const advisor01 = await CreateReport.getPersonByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(await advisor01.conflictButton.isExisting()).to.equal(false)

    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()

    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_DRAFT
    )
    expect(await ShowReport.getIntent()).to.equal(report03.intent)

    thirdReportUUID = await ShowReport.getUuid()
    expect(thirdReportUUID.length).to.equal(36)
  })

  it("Should display third report without conflicts", async () => {
    await ShowReport.open(thirdReportUUID)
    await ShowReport.waitForShowReportToLoad()

    expect((await ShowReport.getUuid()).length).to.equal(36)
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_DRAFT
    )
    expect(await ShowReport.getIntent()).to.equal(report03.intent)
    expect(await ShowReport.getEngagementDate()).to.equal(
      report03.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    expect(
      await (await ShowReport.getReportConflictIcon()).isExisting()
    ).to.equal(false)

    const advisor01 = await ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(await advisor01.conflictButton.isExisting()).to.equal(false)
  })

  it("Should delete the third report", async () => {
    await EditReport.open(thirdReportUUID)
    await EditReport.deleteReport(thirdReportUUID, false)

    expect(await (await EditReport.getAlertSuccess()).getText()).to.equal(
      "Report deleted"
    )
  })
})
