import { expect } from "chai"
import Home from "../pages/home.page"

describe("Anet home page", () => {
  it("should be able to logout using the dropdown in header", async() => {
    await Home.open()
    await (await Home.getBannerDropdown()).click()
    await (await Home.getLogoutButton()).waitForDisplayed()
    await (await Home.getLogoutButton()).click()
    await Home.waitForLoginForm()
  })
  it("should have the right title", async() => {
    await Home.open()
    await browser.pause(5000) // Wait until the title is set
    const title = await browser.getTitle()
    await expect(title).to.equal("Home - ANET")
    await Home.logout()
  })
  it("should have the right security marking", async() => {
    await Home.open()
    const securityMarking = await (await Home.getBannerSecurityText()).getText()
    const defaultSecurityMarking = "DEMO USE ONLY Releasable to DEMO MISSION"
    await expect(securityMarking).to.equal(defaultSecurityMarking)
    await Home.logout()
  })
})

describe("Anet default user login", () => {
  it("Default user is logged in", async() => {
    await Home.open()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const defaultUserValue = "ERINSON, Erin"
    await expect(bannerUser).to.equal(defaultUserValue)
    await Home.logout()
  })
})

describe("Anet super user login", () => {
  it("Super user is logged in", async() => {
    await Home.openAsSuperUser()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const superUserValue = "BECCABON, Rebecca"
    await expect(bannerUser).to.equal(superUserValue)
    await Home.logout()
  })
})

describe("Anet admin user login", () => {
  it("Admin user is logged in", async() => {
    await Home.openAsAdminUser()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const adminUserValue = "DMIN, Arthur"
    await expect(bannerUser).to.equal(adminUserValue)
    await Home.logout()
  })
})
