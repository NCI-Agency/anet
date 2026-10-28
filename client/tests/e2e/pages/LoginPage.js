import { expect } from "@playwright/test"

export class LoginPage {
  constructor(page) {
    this.page = page
    this.username = page.locator("#username")
    this.password = page.locator("#password")
    this.signIn = page.locator("#kc-login")
  }

  async login(pathname = "/", user = "erin") {
    await this.page.goto(pathname)
    await this.username.fill(user)
    await this.password.fill(user)
    await this.signIn.click()
    // Neither the login form nor the loader is present during intermediate redirects.
    await expect(this.page.locator("#topbar")).toBeVisible({ timeout: 30000 })
    await expect(this.page.locator("div.loader")).toHaveCount(0)
    await expect(
      this.page.locator(".not-found-text").filter({
        hasText:
          "There was an error processing this request. Please contact an administrator."
      })
    ).toHaveCount(0)
  }

  async logout() {
    await this.page.goto("/api/logout")
    await this.page.locator("#kc-logout").click()
    await expect(this.page.locator(".logout-container")).toBeVisible()
  }
}
