import { expect, test } from "@playwright/test"
import moment from "moment"
import OnboardPagePageObject from "../pages/onboard.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, OnboardPage
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    OnboardPage = new OnboardPagePageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const REPORT_URL = "/reports/59be259b-30b9-4d04-9e21-e8ceb58cbe9c"
  const ONBOARD_USER = {
    familyName: "Bonnsdottir",
    givenName: "Bonny",
    emailAddresses: ["", "bonny@example.com"]
  }

  // Only required fields in onboarding/edit page
  const personDetails = {
    rank: "CIV",
    gender: "FEMALE",
    country: "Albania",
    endOfTourDate: moment().add(1, "days").format("DD-MM-YYYY")
  }
  test.describe("Onboard new user login", () => {
    test("Should show onboard welcome", async () => {
      await OnboardPage.openAsOnboardUser(REPORT_URL)
      const welcomeText = "Welcome to ANET"
      await OnboardPage.waitForWelcomeMessage(welcomeText)
      await expect(await OnboardPage.getWelcomeText()).toHaveText(welcomeText, {
        useInnerText: true
      })
    })
    test("Should click on create your account", async () => {
      await (
        await OnboardPage.getCreateYourAccountBtn()
      ).scrollIntoViewIfNeeded()
      await (await OnboardPage.getCreateYourAccountBtn()).click()
      // wait for the page transition and rendering of custom fields

      // Check that these are properly copied from the authentication server
      await (
        await OnboardPage.getFamilyName()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await OnboardPage.getFamilyName()).toHaveValue(
        ONBOARD_USER.familyName
      )
      await (
        await OnboardPage.getGivenName()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await OnboardPage.getGivenName()).toHaveValue(
        ONBOARD_USER.givenName
      )
      await (
        await OnboardPage.getEmailAddress(0)
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      for (const [index, address] of ONBOARD_USER.emailAddresses.entries()) {
        await expect(await OnboardPage.getEmailAddress(index)).toHaveValue(
          address
        )
      }

      // Check that biography does not exist
      await (
        await OnboardPage.getBiography()
      ).waitFor({
        state: "detached",
        timeout: 10000
      })
    })
    test("Should not save if endOfTourDate is not in the future", async () => {
      await (
        await OnboardPage.getEndOfTourDate()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      const yesterday = moment().subtract(1, "days").format("DD-MM-YYYY")
      await OnboardPage.deleteInput(OnboardPage.getEndOfTourDate())
      await (await OnboardPage.getEndOfTourDate()).fill(String(yesterday))
      await (await OnboardPage.getFamilyName()).click()
      const errorMessage = await (
        await OnboardPage.getEndOfTourDate()
      )
        .locator("..")
        .locator("..")
        .locator("..")
        .locator("..")
        .locator("div.invalid-feedback")
        .first()
      await errorMessage.waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(errorMessage).toHaveText(
        "The End of tour date must be in the future",
        {
          useInnerText: true
        }
      )
    })
    test("Should save if all fields properly filled", async () => {
      await (await OnboardPage.getRank()).selectOption(personDetails.rank)
      await (await OnboardPage.getGender()).selectOption(personDetails.gender)
      await (await OnboardPage.getCountryInput()).click()
      await (
        await OnboardPage.getCountryInput()
      ).fill(String(personDetails.country))
      await OnboardPage.waitForCountryAdvancedSelectToChange(
        personDetails.country
      )
      await expect(
        await OnboardPage.getCountryAdvancedSelectFirstItem()
      ).toContainText(personDetails.country, {
        useInnerText: true
      })
      await (await OnboardPage.getCountryAdvancedSelectFirstItem()).click()
      await (
        await OnboardPage.getCountryHelpBlock()
      ).waitFor({
        state: "detached",
        timeout: 10000
      })
      await OnboardPage.deleteInput(OnboardPage.getEndOfTourDate())
      await (
        await OnboardPage.getEndOfTourDate()
      ).fill(String(personDetails.endOfTourDate))
      await (await OnboardPage.getFamilyName()).click()
      // wait for the error message to disappear
      await OnboardPage.submitForm()
    })
    test("Should be redirected to the original URL", async () => {
      // wait for the page to load
      // We should be redirected to the REPORT_URL
      await page.waitForURL(url => url.pathname === REPORT_URL)
      await OnboardPage.logout()
    })
  })
})
