import { expect, test } from "@playwright/test"
import { LoginPage } from "./pages/LoginPage.js"

test("Home Page", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/")

  // Use a CSS selector to find an element that we care about on the page.
  const draftReports = page.locator(".home-tile h1").nth(0)
  const reportsPending = page.locator(".home-tile h1").nth(1)
  const orgReports = page.locator(".home-tile h1").nth(2)
  const plannedEngagements = page.locator(".home-tile h1").nth(3)
  const sensitiveInfo = page.locator(".home-tile h1").nth(4)
  await expect(reportsPending).toHaveText(/^\d+$/)
  await expect(draftReports).toHaveText(/^\d+$/)
  await expect(orgReports).toHaveText(/^\d+$/)
  await expect(plannedEngagements).toHaveText(/^\d+$/)
  await expect(sensitiveInfo).toHaveText(/^\d+$/)
  const tourLauncher = page.locator(".persistent-tour-launcher").first()
  await tourLauncher.click()
  const guidedTourTitle = page.locator("div.react-joyride__tooltip h4").first()
  await expect(
    guidedTourTitle,
    "Clicking the launch button starts the Guided Tour"
  ).toHaveText("Welcome")
  const guidedTourNext = page
    .locator("div.react-joyride__tooltip > div > button")
    .first()
  await guidedTourNext.click()
  const guidedTourClose = page
    .locator('button[data-testid="button-close"]')
    .first()
  await guidedTourClose.click()
  await expect(
    page.locator("div.react-joyride__tooltip"),
    "Closing the dialog clears the Guided Tour"
  ).toHaveCount(0)
  await login.logout()
})
