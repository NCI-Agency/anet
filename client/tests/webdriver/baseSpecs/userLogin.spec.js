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
    const securityText = Home.securityBanner.getText()
    const defaultUserValue = "DEMO USE ONLY || ERINSON, Erin (edit)"
    expect(securityText.startsWith(defaultUserValue)).to.equal(true)
  })
})

describe("Anet super user login", () => {
  it('Super user is logged in"', () => {
    Home.openAsSuperUser()
    const securityText = Home.securityBanner.getText()
    const superUserValue = "DEMO USE ONLY || BECCABON, Rebecca (edit)"
    expect(securityText.startsWith(superUserValue)).to.equal(true)
  })
})

describe("Anet admin user login", () => {
  it('Admin user is logged in"', () => {
    Home.openAsAdminUser()
    const securityText = Home.securityBanner.getText()
    const adminUserValue = "DEMO USE ONLY || DMIN, Arthur (edit)"
    expect(securityText.startsWith(adminUserValue)).to.equal(true)
  })
})
