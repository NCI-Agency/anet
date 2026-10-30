import { expect, test } from "@playwright/test"
import moment from "moment"
import HomePageObject from "../pages/home.page.js"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import CreateReportPageObject from "../pages/report/createReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"
import SearchPageObject from "../pages/search.page.js"

test.describe(() => {
  let page, Home, MyReports, CreateReport, ShowReport, Search
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    Home = new HomePageObject(page)
    MyReports = new MyReportsPageObject(page)
    CreateReport = new CreateReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
    Search = new SearchPageObject(page)
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
  test("When creating a report for an event with engagement date outside of event", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 7)

    await test.step(
      "Should save draft report with the engagement date",
      async () => {
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
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should warn user about engagement date outside of event",
      async () => {
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
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should submit report with engagement date outside of event",
      async () => {
        await (await ShowReport.getConfirmSubmitButton()).click()
        // Wait for status text to be updated
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_PENDING_APPROVALS,
          {
            useInnerText: true
          }
        )
        await ShowReport.logout()
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should show engagement date outside of event warning to initial approver",
      async () => {
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
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should show engagement date outside of event warning to secondary reviewer",
      async () => {
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
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should show engagement date outside of event warning to task owner",
      async () => {
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
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should complete the approval chain",
      async () => {
        await MyReports.open("erin")
        await MyReports.selectReport(
          REPORT_FIELDS.intent,
          REPORT_STATES.APPROVED
        )
        await expect(await ShowReport.getReportStatus()).toHaveText(
          ShowReport.REPORT_IS_APPROVED,
          {
            useInnerText: true
          }
        )
        await ShowReport.logout()
      },
      { timeout: stepTimeout }
    )
  })
  test("When creating a report for an event", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 1)

    await test.step(
      "Should allow the user to override the location",
      async () => {
        await CreateReport.open()
        // wait for the page transition and rendering of custom fields
        await CreateReport.fillForm(REPORT_FIELDS)
        // We should be able to select a different location
        await CreateReport.selectLocation("Fort Amherst")
      },
      { timeout: stepTimeout }
    )
  })
})
