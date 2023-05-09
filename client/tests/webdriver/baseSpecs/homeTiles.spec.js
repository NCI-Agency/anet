import { expect } from "chai"
import Home from "../pages/home.page"

describe("When checking the home page tiles", () => {
  it("Should see correct number of pendingApprovalOf reports count when logged in as Arthur", async() => {
    await Home.openAsAdminUser()
    await (await Home.getHomeTilesContainer()).waitForExist()
    await (await Home.getHomeTilesContainer()).waitForDisplayed()
    // Depends on test data
    expect(await (await Home.getPendingMyApprovalOfCount()).getText()).to.eq(
      "2"
    )
  })
})
