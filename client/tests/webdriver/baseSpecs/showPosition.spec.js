import { expect } from "chai"
import ShowPosition from "../pages/showPosition.page"

const POSITION_WITH_AG_UUID = "05c42ce0-34a0-4391-8b2f-c4cd85ee6b47" // EF 5.1 Advisor Quality Assurance

describe("Show position page", () => {
  describe("When on the show page of a position with authorizationGroup(s)", () => {
    it("We should see a table with authorizationGroups", async() => {
      await ShowPosition.open(POSITION_WITH_AG_UUID)
      await (await ShowPosition.getAuthorizationGroupsTable()).waitForExist()
      await (
        await ShowPosition.getAuthorizationGroupsTable()
      ).waitForDisplayed()
      expect(
        await (await ShowPosition.getAuthorizationGroupsTable()).getText()
      ).to.contain("EF 5")
    })
    it("We can go to the show page of authorizationGroup", async() => {
      await (await ShowPosition.getAuthorizationGroup(1)).click()
      await expect(await browser.getUrl()).to.include(
        "/authorizationGroups/ab1a7d99-4529-44b1-a118-bdee3ca8296b"
      )
    })
  })
})
