import { expect } from "@playwright/test"
import ShowMartImportedReports from "../pages/showMartImportedReports.page.js"
import { test, waitFor } from "../support.js"

test.describe("Show Mart importer page", () => {
  test.describe("When on the Mart imported page we should see one imported report", () => {
    test("We should see rows in the imported reports table", async () => {
      await ShowMartImportedReports.openAsAdminUser()
      await waitFor(await ShowMartImportedReports.getTable(), "visible")
      await expect(
        await ShowMartImportedReports.getTableRows()
      ).not.toHaveCount(0)
    })
  })
  test.describe("When on the Mart importer page we should see a button to export the dictionary button", () => {
    test("We should see the button", async () => {
      await ShowMartImportedReports.openAsAdminUser()
      await waitFor(
        await ShowMartImportedReports.getExportDictionaryButton(),
        "visible"
      )
    })
  })
})
