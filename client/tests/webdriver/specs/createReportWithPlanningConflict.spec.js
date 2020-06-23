import { expect } from "chai"
import moment from "moment"
import CreateReport from "../pages/report/createReport.page"
import EditReport from "../pages/report/editReport.page"
import MyReports from "../pages/report/myReports.page"
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
    advisors: ["CIV REINTON, Reina"],
    principals: ["CIV TOPFERNESS, Christopf"]
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
    advisors: ["CIV REINTON, Reina", "CIV ANDERSON, Andrew"],
    principals: ["CIV TOPFERNESS, Christopf", "Maj ROGWELL, Roger"]
  }

  it("Should create first draft report without any conflicts", () => {
    CreateReport.open()
    CreateReport.fillForm(report01)

    expect(CreateReport.intent.getValue()).to.equal(report01.intent)
    expect(CreateReport.engagementDate.getValue()).to.equal(
      report01.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    expect(CreateReport.duration.getValue()).to.equal(report01.duration)
    const advisor01 = CreateReport.getAdvisor(1)
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(advisor01.conflictButton.isExisting()).to.equal(false)

    const advisor02 = CreateReport.getAdvisor(2)
    expect(advisor02.name).to.equal(report01.advisors[0])
    expect(advisor02.conflictButton.isExisting()).to.equal(false)

    const principal01 = CreateReport.getPrincipal(1)
    expect(principal01.name).to.equal(report01.principals[0])
    expect(principal01.conflictButton.isExisting()).to.equal(false)

    CreateReport.submitForm()
    ShowReport.waitForShowReportToLoad()

    const text = "This is a DRAFT planned engagement and hasn't been submitted."
    expect(ShowReport.reportStatusText).to.equal(text)
    expect(ShowReport.intent).to.equal(report01.intent)

    firstReportUUID = ShowReport.uuid
    expect(firstReportUUID.length).to.equal(36)
  })

  it("Should create second draft report with conflicts", () => {
    CreateReport.open()
    CreateReport.fillForm(report02)

    expect(CreateReport.intent.getValue()).to.equal(report02.intent)
    expect(CreateReport.engagementDate.getValue()).to.equal(
      report02.engagementDate.format("DD-MM-YYYY HH:mm")
    )
    expect(CreateReport.duration.getValue()).to.equal(report02.duration)
    const advisor01 = CreateReport.getAdvisor(1)
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(advisor01.conflictButton.isExisting()).to.equal(true)

    const advisor02 = CreateReport.getAdvisor(2)
    expect(advisor02.name).to.equal(report02.advisors[0])
    expect(advisor02.conflictButton.isExisting()).to.equal(true)

    const advisor03 = CreateReport.getAdvisor(3)
    expect(advisor03.name).to.equal(report02.advisors[1])
    expect(advisor03.conflictButton.isExisting()).to.equal(false)

    const principal01 = CreateReport.getPrincipal(1)
    expect(principal01.name).to.equal(report02.principals[0])
    expect(principal01.conflictButton.isExisting()).to.equal(true)

    const principal02 = CreateReport.getPrincipal(2)
    expect(principal02.name).to.equal(report02.principals[1])
    expect(principal02.conflictButton.isExisting()).to.equal(false)

    CreateReport.submitForm()
    ShowReport.waitForShowReportToLoad()

    const text = "This is a DRAFT planned engagement and hasn't been submitted."
    expect(ShowReport.reportStatusText).to.equal(text)
    expect(ShowReport.intent).to.equal(report02.intent)

    secondReportUUID = ShowReport.uuid
    expect(secondReportUUID.length).to.equal(36)
  })

  it("Should display first report with conflicts", () => {
    ShowReport.open(firstReportUUID)
    ShowReport.waitForShowReportToLoad()

    expect(ShowReport.uuid.length).to.equal(36)

    const statusText =
      "This is a DRAFT planned engagement and hasn't been submitted."
    expect(ShowReport.reportStatusText).to.equal(statusText)

    expect(ShowReport.intent).to.equal(report01.intent)
    expect(ShowReport.engagementDate).to.equal(
      report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    expect(ShowReport.reportConflictIcon.isExisting()).to.equal(true)

    ShowReport.reportConflictIcon.moveTo()
    expect(ShowReport.reportConflictTooltipTitle).to.equal(
      "3 of 3 attendees are busy at the selected time!"
    )

    expect(ShowReport.duration).to.equal(report01.duration)
    expect(ShowReport.location).to.equal("Unspecified")
    expect(ShowReport.author).to.equal("CIV ERINSON, Erin")

    const advisor01 = ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(advisor01.conflictButton.isExisting()).to.equal(true)
    expect(advisor01.conflictButton.getText()).to.equal("1 conflict")

    const advisor02 = ShowReport.getAttendeeByName(report01.advisors[0])
    expect(advisor02.name).to.equal(report01.advisors[0])
    expect(advisor02.conflictButton.isExisting()).to.equal(true)
    expect(advisor02.conflictButton.getText()).to.equal("1 conflict")

    const principal01 = ShowReport.getAttendeeByName(report01.principals[0])
    expect(principal01.name).to.equal(report01.principals[0])
    expect(principal01.conflictButton.isExisting()).to.equal(true)
    expect(principal01.conflictButton.getText()).to.equal("1 conflict")
  })

  it("Should display second report with conflicts", () => {
    ShowReport.open(secondReportUUID)
    ShowReport.waitForShowReportToLoad()

    expect(ShowReport.uuid.length).to.equal(36)

    const statusText =
      "This is a DRAFT planned engagement and hasn't been submitted."
    expect(ShowReport.reportStatusText).to.equal(statusText)

    expect(ShowReport.intent).to.equal(report02.intent)
    expect(ShowReport.engagementDate).to.equal(
      report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    )
    expect(ShowReport.reportConflictIcon.isExisting()).to.equal(true)

    ShowReport.reportConflictIcon.moveTo()
    expect(ShowReport.reportConflictTooltipTitle).to.equal(
      "3 of 5 attendees are busy at the selected time!"
    )

    expect(ShowReport.duration).to.equal(report02.duration)
    expect(ShowReport.location).to.equal("Unspecified")
    expect(ShowReport.author).to.equal("CIV ERINSON, Erin")

    const advisor01 = ShowReport.getAttendeeByName("CIV ERINSON, Erin")
    expect(advisor01.name).to.equal("CIV ERINSON, Erin")
    expect(advisor01.conflictButton.isExisting()).to.equal(true)
    expect(advisor01.conflictButton.getText()).to.equal("1 conflict")

    const advisor02 = ShowReport.getAttendeeByName("CIV ANDERSON, Andrew")
    expect(advisor02.conflictButton.isExisting()).to.equal(false)

    const advisor03 = ShowReport.getAttendeeByName("CIV REINTON, Reina")
    expect(advisor03.conflictButton.isExisting()).to.equal(true)
    expect(advisor03.conflictButton.getText()).to.equal("1 conflict")

    const principal01 = ShowReport.getAttendeeByName(
      "CIV TOPFERNESS, Christopf"
    )
    expect(principal01.conflictButton.isExisting()).to.equal(true)
    expect(principal01.conflictButton.getText()).to.equal("1 conflict")

    const principal02 = ShowReport.getAttendeeByName("Maj ROGWELL, Roger")
    expect(principal02.conflictButton.isExisting()).to.equal(false)
  })

  it("Should display report summary and report table with conflicts", () => {
    MyReports.open()
    MyReports.waitForMyDraftReportsSummaryTabToLoad()

    const reportConflictIcon01 = MyReports.getDraftReportByEngagementDateString(
      report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    ).reportConflictIcon
    expect(reportConflictIcon01.isExisting()).to.equal(true)

    reportConflictIcon01.moveTo()
    expect(MyReports.reportConflictTooltipTitle).to.equal(
      "3 of 3 attendees are busy at the selected time!"
    )

    const reportConflictIcon02 = MyReports.getDraftReportByEngagementDateString(
      report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm")
    ).reportConflictIcon
    expect(reportConflictIcon02.isExisting()).to.equal(true)

    reportConflictIcon02.moveTo()
    expect(MyReports.reportConflictTooltipTitle).to.equal(
      "3 of 5 attendees are busy at the selected time!"
    )

    MyReports.selectTableTab()
    MyReports.waitForMyDraftReportsTableTabToLoad()

    const reportConflictIcon03 = MyReports.getDraftReportByEngagementDateString(
      report01.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"),
      "table"
    ).reportConflictIcon
    expect(reportConflictIcon03.isExisting()).to.equal(true)

    reportConflictIcon03.moveTo()
    expect(MyReports.reportConflictTooltipTitle).to.equal(
      "3 of 3 attendees are busy at the selected time!"
    )

    const reportConflictIcon04 = MyReports.getDraftReportByEngagementDateString(
      report02.engagementDate.format("dddd, D MMMM YYYY @ HH:mm"),
      "table"
    ).reportConflictIcon
    expect(reportConflictIcon04.isExisting()).to.equal(true)

    reportConflictIcon04.moveTo()
    expect(MyReports.reportConflictTooltipTitle).to.equal(
      "3 of 5 attendees are busy at the selected time!"
    )
  })

  it("Should delete the first report", () => {
    EditReport.open(firstReportUUID)
    EditReport.deleteReport(firstReportUUID)

    expect(EditReport.alertSuccess.getText()).to.equal("Report deleted")
  })

  it("Should delete the second report", () => {
    EditReport.open(secondReportUUID)
    EditReport.deleteReport(secondReportUUID)

    expect(EditReport.alertSuccess.getText()).to.equal("Report deleted")
  })
})
