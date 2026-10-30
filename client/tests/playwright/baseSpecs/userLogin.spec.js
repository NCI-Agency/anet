import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Anet home page", () => {
    test("should be able to logout using the dropdown in header and login from logout page", async () => {
      await Home.open()
      await (await Home.getBannerDropdown()).click()
      await (await Home.getLogoutButton()).click()
      if ((await (await Home.getLogoutFormSubmitButton()).count()) > 0) {
        await (await Home.getLogoutFormSubmitButton()).click()
      }
      await expect(page).toHaveTitle("ANET Sign Out")
      await (await Home.getLoginButton()).click()
      await expect(page).toHaveTitle("Sign in to ANET")
    })
    test("should have the right title", async () => {
      await Home.open()
      // Wait until the title is set
      await expect(page).toHaveTitle("Home - ANET")
      await Home.logout()
    })
    test("should have the right security marking", async () => {
      await Home.open()
      const defaultSecurityMarking =
        "DEMO USE ONLY" + "Releasable to DEMO MISSION"
      await expect(await Home.getBannerSecurityText()).toHaveText(
        defaultSecurityMarking,
        {
          useInnerText: true
        }
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
})
