import { expect } from "chai"
import Home from "../pages/home.page"

describe("Anet home page", function() {
  it("should have the right title", function() {
    Home.open()
    const title = browser.getTitle()
    expect(title).to.equal("ANET")
  })
})

describe("Anet default user login", () => {
  it('Default user is logged in"', () => {
    Home.open()
    const defaultUserValue = "DEMO USE ONLY || ERINSON, Erin (edit)"
    Home.waitForSecurityBannerValue(defaultUserValue)

    const securityText = Home.securityBanner.getText()
    expect(securityText).to.equal(defaultUserValue)
  })
})

describe("Anet super user login", () => {
  it('Super user is logged in"', () => {
    Home.openAsSuperUser()
    const superUserValue = "DEMO USE ONLY || BECCABON, Rebecca (edit)"
    Home.waitForSecurityBannerValue(superUserValue)

    const securityText = Home.securityBanner.getText()
    expect(securityText).to.equal(superUserValue)
  })
})

describe("Anet admin user login", () => {
  it('Admin user is logged in"', () => {
    Home.openAsAdminUser()
    const adminUserValue = "DEMO USE ONLY || DMIN, Arthur (edit)"
    Home.waitForSecurityBannerValue(adminUserValue)

    const securityText = Home.securityBanner.getText()
    expect(securityText).to.equal(adminUserValue)
  })
})
