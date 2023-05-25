import { expect } from "chai"
import moment from "moment"
import Home from "../pages/home.page"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import CreateReport from "../pages/report/createReport.page"
import ShowReport from "../pages/report/showReport.page"
import Search from "../pages/search.page"

const REPORT_FIELDS = {
  intent: "An engagement report without primary principal",
  engagementDate: moment().subtract(1, "day"),
  duration: "60",
  location: "Cabot Tower",
  atmosphere: "Positive",
  advisors: ["CIV REPORTGUY, Ima"],
  tasks: ["2.A"],
  keyOutcomes: "Primary principal attendee is not required",
  nextSteps: "Test steps",
  reportText: "Test text"
}

const NO_PRINCIPAL_WARNING =
  "No primary Afghan Partner has been provided for the Engagement"

describe("When creating a report without a principal", () => {
  it("Should save draft report without primary principal attendee", async() => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    await browser.pause(500)
    await CreateReport.submitForm()
    expect(await (await CreateReport.getAlert()).getText()).to.include(
      NO_PRINCIPAL_WARNING
    )
  })
  it("Should warn user about missing primary principal", async() => {
    await (await ShowReport.getSubmitButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      NO_PRINCIPAL_WARNING
    )
  })
  it("Should submit report without primary principal attendee", async() => {
    await (await ShowReport.getConfirmSubmitButton()).click()
    await browser.pause(1000) // Wait for status text to be updated
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_PENDING_APPROVALS
    )
  })
  it("Should show missing principal warning to initial approver", async() => {
    await MyReports.open("erin")
    await MyReports.selectReport(
      REPORT_FIELDS.intent,
      REPORT_STATES.PENDING_APPROVAL
    )
    await (await ShowReport.getApproveButton()).waitForDisplayed()
    await (await ShowReport.getApproveButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      NO_PRINCIPAL_WARNING
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await (await ShowReport.getSuccessfullApprovalToast()).waitForDisplayed()
    await ShowReport.logout()
  })
  it("Should show missing principal warning to secondary reviewer", async() => {
    await Home.open("/", "rebecca")
    await (await Home.getReportsPendingMyApproval()).waitForDisplayed()
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).waitForDisplayed()
    await (await ShowReport.getApproveButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      NO_PRINCIPAL_WARNING
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await (await ShowReport.getSuccessfullApprovalToast()).waitForDisplayed()
    await ShowReport.logout()
  })
  it("Should show missing principal warning to task owner", async() => {
    await Home.open("/", "henry")
    await (await Home.getReportsPendingMyApproval()).waitForDisplayed()
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).waitForDisplayed()
    await (await ShowReport.getApproveButton()).click()
    await (await ShowReport.getReportModal()).waitForDisplayed()
    expect(await (await ShowReport.getModalWarning()).getText()).to.include(
      NO_PRINCIPAL_WARNING
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await (await ShowReport.getSuccessfullApprovalToast()).waitForDisplayed()
    await ShowReport.logout(true)
  })
  it("Should complete the approval chain", async() => {
    await MyReports.open("erin")
    await MyReports.selectReport(REPORT_FIELDS.intent, REPORT_STATES.APPROVED)
    expect(await ShowReport.getReportStatusText()).to.equal(
      ShowReport.REPORT_IS_APPROVED
    )
  })
})
