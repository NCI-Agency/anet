import { expect } from "@playwright/test"
import moment from "moment"
import Home from "../pages/home.page.js"
import MyReports, { REPORT_STATES } from "../pages/myReports.page.js"
import CreateReport from "../pages/report/createReport.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import Search from "../pages/search.page.js"
import { test, waitFor } from "../support.js"

const REPORT_FIELDS = {
  intent: "An engagement report with date outside of its event",
  engagementDate: moment().subtract(1, "day"),
  duration: "60",
  location: "Cabot Tower",
  atmosphere: "Positive",
  advisors: ["CIV Ima Reportguy"],
  tasks: [
    {
      name: "2.B"
    }
  ],
  event: "NMI PDT 2024-01",
  keyOutcomes: "Report engagement date can be outside of the report event",
  nextSteps: "Test steps",
  reportText: "Test text"
}
const EVENT_DATES_WARNING =
  "The engagement date is not within the dates of the event selected"
test.describe("When creating a report for an event with engagement date outside of event", () => {
  test("Should save draft report with the engagement date", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    await CreateReport.submitForm()
    await expect(await CreateReport.getAlertWarning()).toContainText(
      EVENT_DATES_WARNING,
      {
        useInnerText: true
      }
    )
  })
  test("Should warn user about engagement date outside of event", async () => {
    await (await ShowReport.getSubmitButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      EVENT_DATES_WARNING,
      {
        useInnerText: true
      }
    )
  })
  test("Should submit report with engagement date outside of event", async () => {
    await (await ShowReport.getConfirmSubmitButton()).click()
    // Wait for status text to be updated
    await expect(await ShowReport.getReportStatus()).toHaveText(
      ShowReport.REPORT_IS_PENDING_APPROVALS,
      { useInnerText: true }
    )
    await ShowReport.logout()
  })
  test("Should show engagement date outside of event warning to initial approver", async () => {
    await MyReports.open("erin")
    await MyReports.selectReport(
      REPORT_FIELDS.intent,
      REPORT_STATES.PENDING_APPROVAL
    )
    await (await ShowReport.getApproveButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      EVENT_DATES_WARNING,
      {
        useInnerText: true
      }
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await waitFor(await ShowReport.getSuccessfullApprovalToast(), "visible")
    await ShowReport.logout()
  })
  test("Should show engagement date outside of event warning to secondary reviewer", async () => {
    await Home.open("/", "rebecca")
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      EVENT_DATES_WARNING,
      {
        useInnerText: true
      }
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await waitFor(await ShowReport.getSuccessfullApprovalToast(), "visible")
    await ShowReport.logout(true)
  })
  test("Should show engagement date outside of event warning to task owner", async () => {
    await Home.open("/", "henry")
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      EVENT_DATES_WARNING,
      {
        useInnerText: true
      }
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await waitFor(await ShowReport.getSuccessfullApprovalToast(), "visible")
    await ShowReport.logout(true)
  })
  test("Should complete the approval chain", async () => {
    await MyReports.open("erin")
    await MyReports.selectReport(REPORT_FIELDS.intent, REPORT_STATES.APPROVED)
    await expect(await ShowReport.getReportStatus()).toHaveText(
      ShowReport.REPORT_IS_APPROVED,
      { useInnerText: true }
    )
    await ShowReport.logout()
  })
})
test.describe("When creating a report for an event", () => {
  test("Should allow the user to override the location", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    // We should be able to select a different location
    await CreateReport.selectLocation("Fort Amherst")
  })
})
