import { expect } from "@playwright/test"

export class OrganizationPage {
  constructor(page) {
    this.page = page
    this.supportedPositions = page.locator("#supportedPositions table tbody tr")
    this.vacantPositions = page.locator("#vacantPositions table tbody tr")
  }

  async openMyOrganization() {
    await this.page.locator("#my-organization-nav").click()
    await expect(this.page).toHaveURL(/\/organizations\/[0-9a-f-]+/)
    await expect(this.page.locator("div.loader")).toHaveCount(0)
  }

  async openPerson(personName, positionName) {
    let row = this.supportedPositions.filter({
      has: this.page
        .locator("td:nth-child(3)")
        .getByText(personName, { exact: true })
    })
    if (positionName) {
      row = row.filter({
        has: this.page
          .locator("td:first-child")
          .getByText(positionName, { exact: true })
      })
    }
    await row.locator("td:nth-child(3) a").click()
    await expect(this.page).toHaveURL(/\/people\/[0-9a-f-]+/)
  }
}
