import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PATH = "/admin/merge/organizations"

class MergeOrganizations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return currentPage()
      .locator('//h4[contains(text(),"Merge Organizations")]')
      .first()
  }

  async getLeftOrganizationField() {
    return currentPage().locator("#Organization1").first()
  }

  async getRightOrganizationField() {
    return currentPage().locator("#Organization2").first()
  }

  async getFirstItemFromAdvancedSelect() {
    return currentPage()
      .locator(
        ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
      )
      .first()
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return currentPage()
      .locator(
        "table > tbody > tr:first-child > td:first-child > input.form-check-input"
      )
      .first()
  }

  async getAdvancedSelectPopover() {
    return currentPage().locator(".bp6-popover-content").first()
  }

  async getColumnContent(side, text) {
    return currentPage()
      .locator(
        `//div[@id="${side}-merge-org-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getMergeOrganizationsButton() {
    return currentPage()
      .locator('//button[text()="Merge Organizations"]')
      .first()
  }

  async getOrganizationHeaderFromPopover() {
    return currentPage()
      .locator('//table//th[contains(text(), "Organization")]')
      .first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await currentPage()
      .locator(`//div[@id="${side}-merge-org-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return currentPage()
      .locator(`#mid-merge-org-col ${button} > button`)
      .first()
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await waitFor(await this.getAdvancedSelectPopover(), "visible")
    await waitFor(await this.getOrganizationHeaderFromPopover(), "visible")
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect,
      compareStr
    )
  }

  async waitForColumnToChange(compareStr, side, text) {
    return this.waitForElementToChange(
      async () => this.getColumnContent(side, text),
      compareStr
    )
  }

  async waitForSuccessAlert() {
    return this.waitForElementToChange(
      this.getAlertSuccess,
      "Organizations merged. Displaying merged Organization below."
    )
  }
}

export default new MergeOrganizations()
