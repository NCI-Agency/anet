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
const REPORT_SUBMITTED_STATUS = "This report is PENDING approvals."
const REPORT_APPROVED_STATUS = "This report is APPROVED."

describe("When creating a report without a principal", () => {
  it("Should save draft report without primary principal attendee", () => {
    CreateReport.open()
    browser.pause(500) // wait for the page transition and rendering of custom fields
    CreateReport.fillForm(REPORT_FIELDS)
    browser.pause(500)
    CreateReport.submitForm()
    expect(CreateReport.alert.getText()).to.include(NO_PRINCIPAL_WARNING)
  })
  it("Should warn user about missing primary principal", () => {
    ShowReport.submitButton.click()
    ShowReport.reportModal.waitForDisplayed()
    expect(ShowReport.modalWarning.getText()).to.include(NO_PRINCIPAL_WARNING)
  })
  it("Should submit report without primary principal attendee", () => {
    ShowReport.confirmSubmitButton.click()
    browser.pause(1000) // Wait for status text to be updated
    expect(ShowReport.reportStatusText).to.equal(REPORT_SUBMITTED_STATUS)
  })
  it("Should show missing principal warning to initial approver", () => {
    MyReports.open("erin")
    MyReports.selectReport(REPORT_FIELDS.intent, REPORT_STATES.PENDING_APPROVAL)
    ShowReport.approveButton.waitForDisplayed()
    ShowReport.approveButton.click()
    ShowReport.reportModal.waitForDisplayed()
    expect(ShowReport.modalWarning.getText()).to.include(NO_PRINCIPAL_WARNING)
    ShowReport.confirmApproveButton.click()
    ShowReport.successfullApprovalToast.waitForDisplayed()
    ShowReport.logout()
  })
  it("Should show missing principal warning to secondary reviewer", () => {
    Home.open("/", "rebecca")
    Home.reportsPendingMyApproval.waitForDisplayed()
    Home.reportsPendingMyApproval.click()
    Search.selectReport(REPORT_FIELDS.intent)
    ShowReport.approveButton.waitForDisplayed()
    ShowReport.approveButton.click()
    ShowReport.reportModal.waitForDisplayed()
    expect(ShowReport.modalWarning.getText()).to.include(NO_PRINCIPAL_WARNING)
    ShowReport.confirmApproveButton.click()
    ShowReport.successfullApprovalToast.waitForDisplayed()
    ShowReport.logout()
  })
  it("Should show missing principal warning to task owner", () => {
    Home.open("/", "henry")
    Home.reportsPendingMyApproval.waitForDisplayed()
    Home.reportsPendingMyApproval.click()
    Search.selectReport(REPORT_FIELDS.intent)
    ShowReport.approveButton.waitForDisplayed()
    ShowReport.approveButton.click()
    ShowReport.reportModal.waitForDisplayed()
    expect(ShowReport.modalWarning.getText()).to.include(NO_PRINCIPAL_WARNING)
    ShowReport.confirmApproveButton.click()
    ShowReport.successfullApprovalToast.waitForDisplayed()
    ShowReport.logout(true)
  })
  it("Should complete the approval chain", () => {
    MyReports.open("erin")
    MyReports.selectReport(REPORT_FIELDS.intent, REPORT_STATES.APPROVED)
    expect(ShowReport.reportStatusText).to.equal(REPORT_APPROVED_STATUS)
  })
})
