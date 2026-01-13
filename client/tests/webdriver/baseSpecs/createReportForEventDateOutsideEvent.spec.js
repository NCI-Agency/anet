import { expect } from "chai"
import moment from "moment"
import Home from "../pages/home.page"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import CreateReport from "../pages/report/createReport.page"
import ShowReport from "../pages/report/showReport.page"
import Search from "../pages/search.page"

const REPORT_FIELDS = {
  intent: "An engagement report with date outside of its event",
  engagementDate: moment().subtract(1, "day"),
  duration: "60",
  location: "Cabot Tower",
  atmosphere: "Positive",
  advisors: ["CIV REPORTGUY, Ima"],
  tasks: [{ name: "2.B" }],
  event: "NMI PDT 2024-01",
  keyOutcomes: "Report engagement date can be outside of the report event",
  nextSteps: "Test steps",
  reportText: "Test text"
}

const EVENT_DATES_WARNING =
  "The engagement date is not within the dates of the event selected"

describe("When creating a report for an event with engagement date outside of event", () => {
  it("Should save draft report with the engagement date", async () => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    await browser.pause(500)
    await CreateReport.submitForm()
    expect(await (await CreateReport.getAlertWarning()).getText()).to.include(
      EVENT_DATES_WARNING
    )
  })
  it("Should warn user about engagement date outside of event", async () => {
    await (await ShowReport.getSubmitButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      EVENT_DATES_WARNING
    )
  })
  it("Should submit report with engagement date outside of event", async () => {
    await (await ShowReport.getConfirmSubmitButton()).click()
    await browser.pause(1000) // Wait for status text to be updated
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_PENDING_APPROVALS
    )
  })
  it("Should show engagement date outside of event warning to initial approver", async () => {
    await MyReports.open("erin")
    await MyReports.selectReport(
      REPORT_FIELDS.intent,
      REPORT_STATES.PENDING_APPROVAL
    )
    await (await ShowReport.getApproveButton()).waitForDisplayed()
    await (await ShowReport.getApproveButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      EVENT_DATES_WARNING
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await (await ShowReport.getSuccessfullApprovalToast()).waitForDisplayed()
    await ShowReport.logout()
  })
  it("Should show engagement date outside of event warning to secondary reviewer", async () => {
    await Home.open("/", "rebecca")
    await (await Home.getReportsPendingMyApproval()).waitForDisplayed()
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).waitForDisplayed()
    await (await ShowReport.getApproveButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      EVENT_DATES_WARNING
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await (await ShowReport.getSuccessfullApprovalToast()).waitForDisplayed()
    await ShowReport.logout()
  })
  it("Should show engagement date outside of event warning to task owner", async () => {
    await Home.open("/", "henry")
    await (await Home.getReportsPendingMyApproval()).waitForDisplayed()
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).waitForDisplayed()
    await (await ShowReport.getApproveButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      EVENT_DATES_WARNING
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await (await ShowReport.getSuccessfullApprovalToast()).waitForDisplayed()
    await ShowReport.logout(true)
  })
  it("Should complete the approval chain", async () => {
    await MyReports.open("erin")
    await MyReports.selectReport(REPORT_FIELDS.intent, REPORT_STATES.APPROVED)
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_APPROVED
    )
  })
})
