import { expect } from "chai"
import Home from "../pages/home.page"

describe("Anet home page", () => {
  it("should be able to logout using the dropdown in header and login from logout page", async() => {
    await Home.open()
    await (await Home.getBannerDropdown()).click()
    await (await Home.getLogoutButton()).waitForDisplayed()
    await (await Home.getLogoutButton()).click()
    const title = await browser.getTitle()
    await expect(title).to.equal("ANET Sign Out")
    await (await Home.getLoginButton()).waitForDisplayed()
    await (await Home.getLoginButton()).click()
    const titleLogin = await browser.getTitle()
    await expect(titleLogin).to.equal("Sign in to ANET")
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

describe("Anet superuser login", () => {
  it("Superuser is logged in", async() => {
    await Home.openAsSuperuser()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const superuserValue = "BECCABON, Rebecca"
    await expect(bannerUser).to.equal(superuserValue)
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
