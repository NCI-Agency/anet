import { expect, test } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage.js"

const resources = [
  { resource: "Reports", path: "/reports" },
  { resource: "Organizations", path: "/organizations" },
  { resource: "People", path: "/people" },
  { resource: "Tasks", path: "/tasks" },
  { resource: "Positions", path: "/positions" },
  { resource: "Attachments", path: "/attachments" },
  { resource: "Communities", path: "/communities" },
  { resource: "Locations", path: "/locations" },
  { resource: "Events", path: "/events" },
  { resource: "EventSeries", path: "/eventSeries" }
]

const invalidUuids = ["555", "-1", "not-a-uuid", "1-1-1-1-1"]

test.describe("400 Bad Request pages", () => {
  for (const { resource, path } of resources) {
    for (const uuid of invalidUuids) {
      test(`${resource} 400 (invalid UUID: ${uuid})`, async ({ page }) => {
        const login = new LoginPage(page)
        await login.login()
        const [response] = await Promise.all([
          page.waitForResponse(
            response =>
              new URL(response.url()).pathname === "/graphql" &&
              response.request().method() === "POST" &&
              response.request().postDataJSON()?.variables?.uuid === uuid
          ),
          page.goto(`${path}/${uuid}`)
        ])
        expect(response.status()).toBe(400)
        expect(await response.json()).toEqual({
          errors: [{ message: "Invalid UUID" }]
        })
        await expect(
          page.getByText("Invalid UUID", { exact: true })
        ).toBeVisible()
        await login.logout()
      })
    }
  }
})
