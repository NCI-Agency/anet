import { expect, test } from "@playwright/test"
import ShowMartImportedReportsPageObject from "../pages/showMartImportedReports.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, ShowMartImportedReports
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    ShowMartImportedReports = new ShowMartImportedReportsPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Show Mart importer page", () => {
    test.describe("When on the Mart imported page we should see one imported report", () => {
      test("We should see rows in the imported reports table", async () => {
        await ShowMartImportedReports.openAsAdminUser()
        await (
          await ShowMartImportedReports.getTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(
          await ShowMartImportedReports.getTableRows()
        ).not.toHaveCount(0)
      })
    })
    test.describe("When on the Mart importer page we should see a button to export the dictionary button", () => {
      test("We should see the button", async () => {
        await ShowMartImportedReports.openAsAdminUser()
        await (
          await ShowMartImportedReports.getExportDictionaryButton()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
    })
  })
})
