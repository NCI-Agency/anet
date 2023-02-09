import { expect } from "chai"
import Home from "../pages/home.page"

describe("When checking the home page tiles", () => {
  it("Should see correct number of pendingApprovalOf reports count when logged in as Arthur", () => {
    Home.openAsAdminUser()
    Home.getHomeTilesContainer().waitForExist()
    Home.getHomeTilesContainer().waitForDisplayed()
    // Depends on test data
    expect(Home.getPendingMyApprovalOfCount().getText()).to.eq("2")
  })
})
