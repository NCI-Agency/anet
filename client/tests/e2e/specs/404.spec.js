import { expect, test } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage.js"

// A missing record must still use an identifier accepted by PostgreSQL UUID columns.
const missingUuid = "00000000-0000-4000-8000-000000000555"

const testCases = [
  {
    resource: "Reports",
    path: `/reports/${missingUuid}`,
    expectedText: `Report #${missingUuid} not found.`
  },
  {
    resource: "Organizations",
    path: `/organizations/${missingUuid}`,
    expectedText: `Organization #${missingUuid} not found.`
  },
  {
    resource: "People",
    path: `/people/${missingUuid}`,
    expectedText: `User #${missingUuid} not found.`
  },
  {
    resource: "Tasks",
    path: `/tasks/${missingUuid}`,
    expectedText: `Task #${missingUuid} not found.`
  },
  {
    resource: "Positions",
    path: `/positions/${missingUuid}`,
    expectedText: `Position #${missingUuid} not found.`
  },
  {
    resource: "Attachments",
    path: `/attachments/${missingUuid}`,
    expectedText: `Attachment #${missingUuid} not found.`
  },
  {
    resource: "Communities",
    path: `/communities/${missingUuid}`,
    expectedText: `AuthorizationGroup #${missingUuid} not found.`
  },
  {
    resource: "Locations",
    path: `/locations/${missingUuid}`,
    expectedText: `Location #${missingUuid} not found.`
  },
  {
    resource: "Events",
    path: `/events/${missingUuid}`,
    expectedText: `Event #${missingUuid} not found.`
  },
  {
    resource: "EventSeries",
    path: `/eventSeries/${missingUuid}`,
    expectedText: `EventSeries #${missingUuid} not found.`
  }
]

test.describe("404 Not Found pages", () => {
  for (const { resource, path, expectedText } of testCases) {
    test(`${resource} 404`, async ({ page }) => {
      const login = new LoginPage(page)
      await login.login(path)
      await expect(page.locator(".not-found-text").first()).toHaveText(
        expectedText
      )
      await login.logout()
    })
  }
})
