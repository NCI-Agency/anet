import { expect } from "@playwright/test"
import moment from "moment"
import Home from "../pages/home.page.js"
import MyReports, { REPORT_STATES } from "../pages/myReports.page.js"
import CreateReport from "../pages/report/createReport.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import Search from "../pages/search.page.js"
import { test, waitFor } from "../support.js"

const REPORT_FIELDS = {
  intent: "An engagement report without primary interlocutor",
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
  keyOutcomes: "Primary interlocutor attendee is not required",
  nextSteps: "Test steps",
  reportText: "Test text"
}
const NO_INTERLOCUTOR_WARNING =
  "No primary interlocutor has been provided for the Engagement"
test.describe("When creating a report without an interlocutor", () => {
  test("Should save draft report without primary interlocutor attendee", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    await CreateReport.submitForm()
    await expect(await CreateReport.getAlertWarning()).toContainText(
      NO_INTERLOCUTOR_WARNING,
      {
        useInnerText: true
      }
    )
  })
  test("Should warn user about missing primary interlocutor", async () => {
    await (await ShowReport.getSubmitButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      NO_INTERLOCUTOR_WARNING,
      {
        useInnerText: true
      }
    )
  })
  test("Should submit report without primary interlocutor attendee", async () => {
    await (await ShowReport.getConfirmSubmitButton()).click()
    // Wait for status text to be updated
    await expect(await ShowReport.getReportStatus()).toHaveText(
      ShowReport.REPORT_IS_PENDING_APPROVALS,
      { useInnerText: true }
    )
    await ShowReport.logout()
  })
  test("Should show missing interlocutor warning to initial approver", async () => {
    await MyReports.open("erin")
    await MyReports.selectReport(
      REPORT_FIELDS.intent,
      REPORT_STATES.PENDING_APPROVAL
    )
    await (await ShowReport.getApproveButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      NO_INTERLOCUTOR_WARNING,
      {
        useInnerText: true
      }
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await waitFor(await ShowReport.getSuccessfullApprovalToast(), "visible")
    await ShowReport.logout()
  })
  test("Should show missing interlocutor warning to secondary reviewer", async () => {
    await Home.open("/", "rebecca")
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      NO_INTERLOCUTOR_WARNING,
      {
        useInnerText: true
      }
    )
    await (await ShowReport.getConfirmApproveButton()).click()
    await waitFor(await ShowReport.getSuccessfullApprovalToast(), "visible")
    await ShowReport.logout(true)
  })
  test("Should show missing interlocutor warning to task owner", async () => {
    await Home.open("/", "henry")
    await (await Home.getReportsPendingMyApproval()).click()
    await Search.selectReport(REPORT_FIELDS.intent)
    await (await ShowReport.getApproveButton()).click()
    await waitFor(await ShowReport.getReportModal(), "visible")
    await expect(await ShowReport.getModalWarning()).toContainText(
      NO_INTERLOCUTOR_WARNING,
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
  })
})
