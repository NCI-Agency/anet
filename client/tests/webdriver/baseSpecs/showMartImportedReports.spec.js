import { expect } from "chai"
import ShowMartImportedReports from "../pages/showMartImportedReports.page"

describe("Show Mart imported reports page", () => {
  describe("When on the Mart imported reports page we should see one imported report", () => {
    it("We should see rows in the organizations table", async() => {
      await ShowMartImportedReports.openAsAdminUser()
      await (await ShowMartImportedReports.getTable()).waitForExist()
      await (await ShowMartImportedReports.getTable()).waitForDisplayed()
      expect(
        await ShowMartImportedReports.getTableRows()
      ).to.have.lengthOf.above(0)
    })
  })
})
