import { expect } from "chai"
import Home from "../pages/home.page"

describe("Anet home page", function() {
  it("should be able to logout using the dropdown in header", () => {
    Home.open()
    Home.getBannerDropdown().click()
    Home.getLogoutButton().waitForDisplayed()
    Home.getLogoutButton().click()
    Home.waitForLoginForm()
  })
  it("should have the right title", function() {
    Home.open()
    browser.pause(5000) // Wait until the title is set
    const title = browser.getTitle()
    expect(title).to.equal("Home - ANET")
    Home.logout()
  })
  it("should have the right security marking", () => {
    Home.open()
    const securityMarking = Home.getBannerSecurityText().getText()
    const defaultSecurityMarking = "DEMO USE ONLY Releasable to DEMO MISSION"
    expect(securityMarking).to.equal(defaultSecurityMarking)
    Home.logout()
  })
})

describe("Anet default user login", () => {
  it("Default user is logged in", () => {
    Home.open()
    const bannerUser = Home.getBannerUser().getText()
    const defaultUserValue = "ERINSON, Erin"
    expect(bannerUser).to.equal(defaultUserValue)
    Home.logout()
  })
})

describe("Anet super user login", () => {
  it("Super user is logged in", () => {
    Home.openAsSuperUser()
    const bannerUser = Home.getBannerUser().getText()
    const superUserValue = "BECCABON, Rebecca"
    expect(bannerUser).to.equal(superUserValue)
    Home.logout()
  })
})

describe("Anet admin user login", () => {
  it("Admin user is logged in", () => {
    Home.openAsAdminUser()
    const bannerUser = Home.getBannerUser().getText()
    const adminUserValue = "DMIN, Arthur"
    expect(bannerUser).to.equal(adminUserValue)
    Home.logout()
  })
})
