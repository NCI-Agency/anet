import { expect, test } from "@playwright/test"
import moment from "moment"
import HomePageObject from "../pages/home.page.js"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import CreateReportPageObject from "../pages/report/createReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"
import SearchPageObject from "../pages/search.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, MyReports, CreateReport, ShowReport, Search
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    MyReports = new MyReportsPageObject(page)
    CreateReport = new CreateReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
    Search = new SearchPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
      await (
        await ShowReport.getReportModal()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
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
        {
          useInnerText: true
        }
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
      await (
        await ShowReport.getReportModal()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowReport.getModalWarning()).toContainText(
        EVENT_DATES_WARNING,
        {
          useInnerText: true
        }
      )
      await (await ShowReport.getConfirmApproveButton()).click()
      await (
        await ShowReport.getSuccessfullApprovalToast()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await ShowReport.logout()
    })
    test("Should show engagement date outside of event warning to secondary reviewer", async () => {
      await Home.open("/", "rebecca")
      await (await Home.getReportsPendingMyApproval()).click()
      await Search.selectReport(REPORT_FIELDS.intent)
      await (await ShowReport.getApproveButton()).click()
      await (
        await ShowReport.getReportModal()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowReport.getModalWarning()).toContainText(
        EVENT_DATES_WARNING,
        {
          useInnerText: true
        }
      )
      await (await ShowReport.getConfirmApproveButton()).click()
      await (
        await ShowReport.getSuccessfullApprovalToast()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await ShowReport.logout(true)
    })
    test("Should show engagement date outside of event warning to task owner", async () => {
      await Home.open("/", "henry")
      await (await Home.getReportsPendingMyApproval()).click()
      await Search.selectReport(REPORT_FIELDS.intent)
      await (await ShowReport.getApproveButton()).click()
      await (
        await ShowReport.getReportModal()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowReport.getModalWarning()).toContainText(
        EVENT_DATES_WARNING,
        {
          useInnerText: true
        }
      )
      await (await ShowReport.getConfirmApproveButton()).click()
      await (
        await ShowReport.getSuccessfullApprovalToast()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await ShowReport.logout(true)
    })
    test("Should complete the approval chain", async () => {
      await MyReports.open("erin")
      await MyReports.selectReport(REPORT_FIELDS.intent, REPORT_STATES.APPROVED)
      await expect(await ShowReport.getReportStatus()).toHaveText(
        ShowReport.REPORT_IS_APPROVED,
        {
          useInnerText: true
        }
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
})
