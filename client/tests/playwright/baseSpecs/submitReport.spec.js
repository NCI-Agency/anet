import { expect as pwExpect } from "@playwright/test"
import ShowReport from "../pages/report/showReport.page.js"
import { test } from "../support.js"

const DRAFT_REPORT_UUID = "530b735e-1134-4daa-9e87-4491c888a4f7"
test.describe("Submit report", () => {
  test.afterEach("Should logout", async () => {
    await ShowReport.logout()
  })
  test.describe("As author", async () => {
    test("Should be able to open Draft report", async () => {
      await ShowReport.open(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      await pwExpect
        .poll(async () => await ShowReport.getUuid())
        .toEqual(DRAFT_REPORT_UUID)
      await pwExpect
        .poll(async () => await ShowReport.getReportStatusText())
        .toEqual(ShowReport.REPORT_IS_DRAFT)
      await pwExpect(await ShowReport.getSubmitButton()).not.toHaveCount(0)
    })
  })
  test.describe("As superuser", async () => {
    test("Should not be able to open Draft report", async () => {
      await ShowReport.openAsSuperuser(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToFail()
    })
  })
  test.describe("As admin", async () => {
    test("Should be able to submit Draft report", async () => {
      await ShowReport.openAsAdminUser(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      await pwExpect(await ShowReport.getSubmitButton()).not.toHaveCount(0)
      // Submit the report
      await (await ShowReport.getSubmitButton()).click()
      // Should be successful

      // Wait for status text to be updated
      await pwExpect
        .poll(async () => await ShowReport.getReportStatusText())
        .toEqual(ShowReport.REPORT_IS_PENDING_APPROVALS)
    })
  })
  test.describe("As author", async () => {
    test("Should be able to set report back to Draft", async () => {
      await ShowReport.open(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      await pwExpect
        .poll(async () => await ShowReport.getReportStatusText())
        .toEqual(ShowReport.REPORT_IS_PENDING_APPROVALS)
      // Edit the report
      await (await ShowReport.getEditReportButton()).click()
      // Save the report
      await (await ShowReport.getPreviewAndSubmitButton()).click()
      // Should be successful
      await ShowReport.waitForShowReportToLoad()
      await pwExpect
        .poll(async () => await ShowReport.getReportStatusText())
        .toEqual(ShowReport.REPORT_IS_DRAFT)
    })
  })
})
