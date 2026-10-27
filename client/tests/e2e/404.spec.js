import { expect, test } from "@playwright/test"
import { LoginPage } from "./pages/LoginPage.js"

test("Report 404", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/reports/555")
  await expect(page.locator(".not-found-text").first()).toHaveText(
    "Report #555 not found."
  )
  await login.logout()
})

test("Organization 404", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/organizations/555")
  await expect(page.locator(".not-found-text").first()).toHaveText(
    "Organization #555 not found."
  )
  await login.logout()
})

test("People 404", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/people/555")
  await expect(page.locator(".not-found-text").first()).toHaveText(
    "User #555 not found."
  )
  await login.logout()
})

test("Tasks 404", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/tasks/555")
  await expect(page.locator(".not-found-text").first()).toHaveText(
    "Task #555 not found."
  )
  await login.logout()
})

test("Positions 404", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/positions/555")
  await expect(page.locator(".not-found-text").first()).toHaveText(
    "Position #555 not found."
  )
  await login.logout()
})
