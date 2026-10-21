import { expect } from "@playwright/test"
import Home from "../pages/home.page.js"
import { currentPage, test } from "../support.js"

test.describe("Anet home page", () => {
  test("should be able to logout using the dropdown in header and login from logout page", async () => {
    await Home.open()
    await (await Home.getBannerDropdown()).click()
    await (await Home.getLogoutButton()).click()
    if ((await (await Home.getLogoutFormSubmitButton()).count()) > 0) {
      await (await Home.getLogoutFormSubmitButton()).click()
    }
    await expect(currentPage()).toHaveTitle("ANET Sign Out")
    await (await Home.getLoginButton()).click()
    await expect(currentPage()).toHaveTitle("Sign in to ANET")
  })
  test("should have the right title", async () => {
    await Home.open()
    // Wait until the title is set
    await expect(currentPage()).toHaveTitle("Home - ANET")
    await Home.logout()
  })
  test("should have the right security marking", async () => {
    await Home.open()
    const defaultSecurityMarking =
      "DEMO USE ONLY" + "Releasable to DEMO MISSION"
    await expect(await Home.getBannerSecurityText()).toHaveText(
      defaultSecurityMarking,
      { useInnerText: true }
    )
    await Home.logout()
  })
})
test.describe("Anet default user login", () => {
  test("Default user is logged in", async () => {
    await Home.open()
    const defaultUserValue = "Erin Erinson"
    await expect(await Home.getBannerUser()).toHaveText(defaultUserValue, {
      useInnerText: true
    })
    await Home.logout()
  })
})
test.describe("Anet superuser login", () => {
  test("Superuser is logged in", async () => {
    await Home.openAsSuperuser()
    const superuserValue = "Rebecca Beccabon"
    await expect(await Home.getBannerUser()).toHaveText(superuserValue, {
      useInnerText: true
    })
    await Home.logout()
  })
})
test.describe("Anet admin user login", () => {
  test("Admin user is logged in", async () => {
    await Home.openAsAdminUser()
    const adminUserValue = "Arthur Dmin"
    await expect(await Home.getBannerUser()).toHaveText(adminUserValue, {
      useInnerText: true
    })
    await Home.logout()
  })
})
