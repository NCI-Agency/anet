import { expect } from "chai"
import moment from "moment"
import CreateReport from "../pages/report/createReport.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"

describe("When creating a Report with conflicts", () => {
  let firstReportUUID
  let secondReportUUID
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
    principals: ["CIV KYLESON, Kyle"]
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
    principals: ["CIV KYLESON, Kyle", "Maj CHRISVILLE, Chris"]
  }

  it("Should create first draft report without any conflicts", async() => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(report01)

    await expect(await (await CreateReport.getIntent()).getValue()).to.equal(
      report01.intent
    )
    await expect(
      await (await CreateReport.getEngagementDate()).getValue()
    ).to.equal(report01.engagementDate.format("DD-MM-YYYY HH:mm"))
    await expect(await (await CreateReport.getDuration()).getValue()).to.equal(
      report01.duration
    )
    const advisor01 = await CreateReport.getPersonByName("CIV ERINSON, Erin")
    await expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    await expect(await advisor01.conflictButton.isExisting()).to.equal(false)

    const advisor02 = await CreateReport.getPersonByName(report01.advisors[0])
    await expect(advisor02.name).to.equal(report01.advisors[0])
    await expect(await advisor02.conflictButton.isExisting()).to.equal(false)

    const principal01 = await CreateReport.getPersonByName(
      report01.principals[0]
    )
    await expect(principal01.name).to.equal(report01.principals[0])
    await expect(await principal01.conflictButton.isExisting()).to.equal(false)

    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()

    const text = "This is a DRAFT planned engagement and hasn't been submitted."
    await expect(await ShowReport.getReportStatusText()).to.equal(text)
    await expect(await ShowReport.getIntent()).to.equal(report01.intent)

    firstReportUUID = await ShowReport.getUuid()
    await expect(firstReportUUID.length).to.equal(36)
  })

  it("Should create second draft report with conflicts", async() => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(report02)

    await expect(await (await CreateReport.getIntent()).getValue()).to.equal(
      report02.intent
    )
    await expect(
      await (await CreateReport.getEngagementDate()).getValue()
    ).to.equal(report02.engagementDate.format("DD-MM-YYYY HH:mm"))
    await expect(await (await CreateReport.getDuration()).getValue()).to.equal(
      report02.duration
    )
    const advisor01 = await CreateReport.getPersonByName("CIV ERINSON, Erin")
    await expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    await expect(await advisor01.conflictButton.isExisting()).to.equal(true)

    const advisor02 = await CreateReport.getPersonByName(report02.advisors[0])
    await expect(advisor02.name).to.equal(report02.advisors[0])
    await expect(await advisor02.conflictButton.isExisting()).to.equal(true)

    const advisor03 = await CreateReport.getPersonByName(report02.advisors[1])
    await expect(advisor03.name).to.equal(report02.advisors[1])
    await expect(await advisor03.conflictButton.isExisting()).to.equal(false)

    const principal01 = await CreateReport.getPersonByName(
      report02.principals[0]
    )
    await expect(principal01.name).to.equal(report02.principals[0])
    await expect(await principal01.conflictButton.isExisting()).to.equal(true)

    const principal02 = await CreateReport.getPersonByName(
      report02.principals[1]
    )
    await expect(principal02.name).to.equal(report02.principals[1])
    await expect(await principal02.conflictButton.isExisting()).to.equal(false)

    await CreateReport.submitForm()
    await ShowReport.waitForShowReportToLoad()

    const text = "This is a DRAFT planned engagement and hasn't been submitted."
    await expect(await ShowReport.getReportStatusText()).to.equal(text)
    await expect(await ShowReport.getIntent()).to.equal(report02.intent)

    secondReportUUID = await ShowReport.getUuid()
    await expect(secondReportUUID.length).to.equal(36)
  })

  it("Should display first report with conflicts", async() => {
    await ShowReport.open(firstReportUUID)
    await ShowReport.waitForShowReportToLoad()

    await expect((await ShowReport.getUuid()).length).to.equal(36)

    const statusText =
      "This is a DRAFT planned engagement and hasn't been submitted."
    await expect(await ShowReport.getReportStatusText()).to.equal(statusText)

    await expect(await ShowReport.getIntent()).to.equal(report01.intent)
    await expect(await ShowReport.getEngagementDate()).to.equal(
      report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    await expect(
      await (await ShowReport.getReportConflictIcon()).isExisting()
    ).to.equal(true)

    await (await ShowReport.getReportConflictIcon()).moveTo()
    await expect(await ShowReport.getReportConflictTooltipTitle()).to.equal(
      "3 of 3 attendees are busy at the selected time!"
    )

    await expect(await ShowReport.getDuration()).to.equal(report01.duration)
    await expect(await ShowReport.getLocation()).to.equal("Unspecified")
    expect(await ShowReport.getAuthors()).to.match(/CIV ERINSON, Erin/)

    const advisor01 = await ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    await expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    await expect(await advisor01.conflictButton.isExisting()).to.equal(true)
    expect(await advisor01.conflictButton.getText()).to.match(/conflict/)

    const advisor02 = await ShowReport.getAttendeeByName(report01.advisors[0])
    await expect(advisor02.name).to.equal(report01.advisors[0])
    await expect(await advisor02.conflictButton.isExisting()).to.equal(true)
    expect(await advisor02.conflictButton.getText()).to.match(/conflict/)

    const principal01 = await ShowReport.getAttendeeByName(
      report01.principals[0]
    )
    await expect(principal01.name).to.equal(report01.principals[0])
    await expect(await principal01.conflictButton.isExisting()).to.equal(true)
    expect(await principal01.conflictButton.getText()).to.match(/conflict/)
  })

  it("Should display second report with conflicts", async() => {
    await ShowReport.open(secondReportUUID)
    await ShowReport.waitForShowReportToLoad()

    await expect((await ShowReport.getUuid()).length).to.equal(36)

    const statusText =
      "This is a DRAFT planned engagement and hasn't been submitted."
    await expect(await ShowReport.getReportStatusText()).to.equal(statusText)

    await expect(await ShowReport.getIntent()).to.equal(report02.intent)
    await expect(await ShowReport.getEngagementDate()).to.equal(
      report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    await expect(
      await (await ShowReport.getReportConflictIcon()).isExisting()
    ).to.equal(true)

    await (await ShowReport.getReportConflictIcon()).moveTo()
    // Depending on the order of the tests, the number of conflicts may vary
    expect(await ShowReport.getReportConflictTooltipTitle()).to.match(
      /(3|5) of 5 attendees are busy at the selected time!/
    )

    await expect(await ShowReport.getDuration()).to.equal(report02.duration)
    await expect(await ShowReport.getLocation()).to.equal("Unspecified")
    expect(await ShowReport.getAuthors()).to.match(/CIV ERINSON, Erin/)

    const advisor01 = await ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    await expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    await expect(await advisor01.conflictButton.isExisting()).to.equal(true)
    expect(await advisor01.conflictButton.getText()).to.match(/conflict/)

    const advisor02 = await ShowReport.getAttendeeByName("CIV REPORTGIRL, Ima")
    await expect(await advisor02.conflictButton.isExisting()).to.equal(false)

    const advisor03 = await ShowReport.getAttendeeByName("CIV REPORTGUY, Ima")
    await expect(await advisor03.conflictButton.isExisting()).to.equal(true)
    expect(await advisor03.conflictButton.getText()).to.match(/conflict/)

    const principal01 = await ShowReport.getAttendeeByName("CIV KYLESON, Kyle")
    await expect(await principal01.conflictButton.isExisting()).to.equal(true)
    expect(await principal01.conflictButton.getText()).to.match(/conflict/)

    const principal02 = await ShowReport.getAttendeeByName(
      "Maj CHRISVILLE, Chris"
    )
    await expect(await principal02.conflictButton.isExisting()).to.equal(false)
  })

  it("Should delete the first report", async() => {
    await EditReport.open(firstReportUUID)
    await EditReport.deleteReport(firstReportUUID)

    await expect(await (await EditReport.getAlertSuccess()).getText()).to.equal(
      "Report deleted"
    )
  })

  it("Should delete the second report", async() => {
    await EditReport.open(secondReportUUID)
    await EditReport.deleteReport(secondReportUUID)

    await expect(await (await EditReport.getAlertSuccess()).getText()).to.equal(
      "Report deleted"
    )
  })
})
