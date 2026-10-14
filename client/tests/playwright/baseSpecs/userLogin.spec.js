import { expect } from "chai"
import Home from "../pages/home.page.js"
import { currentPage, test, waitFor } from "../support.js"

test.describe("Anet home page", () => {
  test("should be able to logout using the dropdown in header and login from logout page", async () => {
    await Home.open()
    await (await Home.getBannerDropdown()).click()
    await waitFor(await Home.getLogoutButton(), "visible")
    await (await Home.getLogoutButton()).click()
    if ((await (await Home.getLogoutFormSubmitButton()).count()) > 0) {
      await (await Home.getLogoutFormSubmitButton()).click()
    }
    const title = await currentPage().title()
    expect(title).to.equal("ANET Sign Out")
    await waitFor(await Home.getLoginButton(), "visible")
    await (await Home.getLoginButton()).click()
    const titleLogin = await currentPage().title()
    expect(titleLogin).to.equal("Sign in to ANET")
  })
  test("should have the right title", async () => {
    await Home.open()
    // Wait until the title is set
    const title = await currentPage().title()
    expect(title).to.equal("Home - ANET")
    await Home.logout()
  })
  test("should have the right security marking", async () => {
    await Home.open()
    const securityMarking = (
      await (await Home.getBannerSecurityText()).innerText()
    ).trim()
    const defaultSecurityMarking =
      "DEMO USE ONLY" + "Releasable to DEMO MISSION"
    expect(securityMarking).to.equal(defaultSecurityMarking)
    await Home.logout()
  })
})
test.describe("Anet default user login", () => {
  test("Default user is logged in", async () => {
    await Home.open()
    const bannerUser = (await (await Home.getBannerUser()).innerText()).trim()
    const defaultUserValue = "Erin Erinson"
    expect(bannerUser).to.equal(defaultUserValue)
    await Home.logout()
  })
})
test.describe("Anet superuser login", () => {
  test("Superuser is logged in", async () => {
    await Home.openAsSuperuser()
    const bannerUser = (await (await Home.getBannerUser()).innerText()).trim()
    const superuserValue = "Rebecca Beccabon"
    expect(bannerUser).to.equal(superuserValue)
    await Home.logout()
  })
})
test.describe("Anet admin user login", () => {
  test("Admin user is logged in", async () => {
    await Home.openAsAdminUser()
    const bannerUser = (await (await Home.getBannerUser()).innerText()).trim()
    const adminUserValue = "Arthur Dmin"
    expect(bannerUser).to.equal(adminUserValue)
    await Home.logout()
  })
})
