import { expect, test } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage.js"

const testCases = [
  {
    resource: "Reports",
    path: "/reports/555",
    expectedText: "Report #555 not found."
  },
  {
    resource: "Organizations",
    path: "/organizations/555",
    expectedText: "Organization #555 not found."
  },
  {
    resource: "People",
    path: "/people/555",
    expectedText: "User #555 not found."
  },
  {
    resource: "Tasks",
    path: "/tasks/555",
    expectedText: "Task #555 not found."
  },
  {
    resource: "Positions",
    path: "/positions/555",
    expectedText: "Position #555 not found."
  },
  {
    resource: "Attachments",
    path: "/attachments/555",
    expectedText: "Attachment #555 not found."
  },
  {
    resource: "Communities",
    path: "/communities/555",
    expectedText: "AuthorizationGroup #555 not found."
  },
  {
    resource: "Locations",
    path: "/locations/555",
    expectedText: "Location #555 not found."
  },
  {
    resource: "Events",
    path: "/events/555",
    expectedText: "Event #555 not found."
  },
  {
    resource: "EventSeries",
    path: "/eventSeries/555",
    expectedText: "EventSeries #555 not found."
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
