import { expect } from "chai"
import Home from "../pages/home.page.js"

describe("Anet home page", () => {
  it("should be able to logout using the dropdown in header and login from logout page", async () => {
    await Home.open()
    await (await Home.getBannerDropdown()).click()
    await (await Home.getLogoutButton()).waitForDisplayed()
    await (await Home.getLogoutButton()).click()
    await browser.waitUntil(
      async () => {
        const confirmLogout = await Home.getLogoutFormSubmitButton()
        if (await confirmLogout.isExisting()) {
          await confirmLogout.click()
        }
        return (await browser.getTitle()) === "ANET Sign Out"
      },
      {
        timeoutMsg: "Expected logout to finish and show the ANET sign-out page"
      }
    )
    const title = await browser.getTitle()
    expect(title).to.equal("ANET Sign Out")
    await (await Home.getLoginButton()).waitForDisplayed()
    await (await Home.getLoginButton()).click()
    await Home.waitForLoginForm()
    const titleLogin = await browser.getTitle()
    expect(titleLogin).to.equal("Sign in to ANET")
  })
  it("should have the right title", async () => {
    await Home.open()
    await browser.waitUntil(
      async () => (await browser.getTitle()) === "Home - ANET",
      { timeoutMsg: "Expected the home page title to be set" }
    )
    const title = await browser.getTitle()
    expect(title).to.equal("Home - ANET")
    await Home.logout()
  })
  it("should have the right security marking", async () => {
    await Home.open()
    const securityMarking = await (await Home.getBannerSecurityText()).getText()
    const defaultSecurityMarking =
      "DEMO USE ONLY" + "Releasable to DEMO MISSION"
    expect(securityMarking).to.equal(defaultSecurityMarking)
    await Home.logout()
  })
})

describe("Anet default user login", () => {
  it("Default user is logged in", async () => {
    await Home.open()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const defaultUserValue = "Erin Erinson"
    expect(bannerUser).to.equal(defaultUserValue)
    await Home.logout()
  })
})

describe("Anet superuser login", () => {
  it("Superuser is logged in", async () => {
    await Home.openAsSuperuser()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const superuserValue = "Rebecca Beccabon"
    expect(bannerUser).to.equal(superuserValue)
    await Home.logout()
  })
})

describe("Anet admin user login", () => {
  it("Admin user is logged in", async () => {
    await Home.openAsAdminUser()
    const bannerUser = await (await Home.getBannerUser()).getText()
    const adminUserValue = "Arthur Dmin"
    expect(bannerUser).to.equal(adminUserValue)
    await Home.logout()
  })
})
