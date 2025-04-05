import { expect } from "chai"
import ShowMartImportedReports from "../pages/showMartImportedReports.page"

describe("Show Mart importer page", () => {
  describe("When on the Mart imported page we should see one imported report", () => {
    it("We should see rows in the imported reports table", async() => {
      await ShowMartImportedReports.openAsAdminUser()
      await (await ShowMartImportedReports.getTable()).waitForExist()
      await (await ShowMartImportedReports.getTable()).waitForDisplayed()
      expect(
        await ShowMartImportedReports.getTableRows()
      ).to.have.lengthOf.above(0)
    })
  })
  describe("When on the Mart importer page we should see a button to export the dictionary button", () => {
    it("We should see the button", async() => {
      await ShowMartImportedReports.openAsAdminUser()
      await (
        await ShowMartImportedReports.getExportDictinaryButton()
      ).waitForExist()
      await (
        await ShowMartImportedReports.getExportDictinaryButton()
      ).waitForDisplayed()
    })
  })
})
