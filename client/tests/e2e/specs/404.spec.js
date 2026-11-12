import { expect, test } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage.js"

const uuid = "00000000-0000-4000-8000-000000000555"

const testCases = uuid => [
  {
    resource: "Reports",
    path: `/reports/${uuid}`,
    expectedText: `Report #${uuid} not found.`
  },
  {
    resource: "Organizations",
    path: `/organizations/${uuid}`,
    expectedText: `Organization #${uuid} not found.`
  },
  {
    resource: "People",
    path: `/people/${uuid}`,
    expectedText: `User #${uuid} not found.`
  },
  {
    resource: "Tasks",
    path: `/tasks/${uuid}`,
    expectedText: `Task #${uuid} not found.`
  },
  {
    resource: "Positions",
    path: `/positions/${uuid}`,
    expectedText: `Position #${uuid} not found.`
  },
  {
    resource: "Attachments",
    path: `/attachments/${uuid}`,
    expectedText: `Attachment #${uuid} not found.`
  },
  {
    resource: "Communities",
    path: `/communities/${uuid}`,
    expectedText: `AuthorizationGroup #${uuid} not found.`
  },
  {
    resource: "Locations",
    path: `/locations/${uuid}`,
    expectedText: `Location #${uuid} not found.`
  },
  {
    resource: "Events",
    path: `/events/${uuid}`,
    expectedText: `Event #${uuid} not found.`
  },
  {
    resource: "EventSeries",
    path: `/eventSeries/${uuid}`,
    expectedText: `EventSeries #${uuid} not found.`
  }
]

test.describe("404 Not Found pages", () => {
  for (const { resource, path, expectedText } of testCases(uuid)) {
    test(`${resource} 404 (missing UUID)`, async ({ page }) => {
      const login = new LoginPage(page)
      await login.login()
      const [response] = await Promise.all([
        page.waitForResponse(
          response =>
            new URL(response.url()).pathname === "/graphql" &&
            response.request().method() === "POST" &&
            response.request().postDataJSON()?.variables?.uuid === uuid
        ),
        page.goto(path)
      ])
      expect(response.status()).toBe(404)
      await expect(page.locator(".not-found-text").first()).toHaveText(
        expectedText
      )
      await login.logout()
    })
  }
})
