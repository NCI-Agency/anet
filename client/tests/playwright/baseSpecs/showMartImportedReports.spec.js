import { expect, test } from "@playwright/test"
import ShowMartImportedReportsPageObject from "../pages/showMartImportedReports.page.js"

test.describe(() => {
  let ShowMartImportedReports
  test.beforeEach(async ({ page }) => {
    ShowMartImportedReports = new ShowMartImportedReportsPageObject(page)
  })
  test.describe("Show Mart importer page", () => {
    test.describe("When on the Mart imported page we should see one imported report", () => {
      test("We should see rows in the imported reports table", async () => {
        await ShowMartImportedReports.openAsAdminUser()
        await (
          await ShowMartImportedReports.getTable()
        ).waitFor({
          state: "visible"
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
          state: "visible"
        })
      })
    })
  })
})
