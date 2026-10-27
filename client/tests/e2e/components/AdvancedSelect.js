import { expect } from "@playwright/test"

export class AdvancedSelect {
  constructor(page, selector) {
    this.page = page
    this.input = page.getByRole("textbox").and(page.locator(selector))
    this.popover = page.locator(`${selector}-popover`)
  }

  async choose(text, rowNumber = 1) {
    await this.input.click()
    await expect(this.popover).toBeVisible()
    // Opening the overlay resets the search; type only after it is open.
    await Promise.all([
      this.page.waitForResponse(response => {
        const request = response.request()
        return (
          request.url().endsWith("/graphql") &&
          request.method() === "POST" &&
          request.postDataJSON()?.variables?.query?.text === `${text}*`
        )
      }),
      this.input.fill(text)
    ])
    await expect(this.popover.locator("div.loader")).toHaveCount(0)
    await this.popover
      .locator("tbody tr")
      .nth(rowNumber - 1)
      .locator("td:first-child input")
      .click()
    return this.input
  }
}
