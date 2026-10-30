import { expect } from "@playwright/test"
import Page from "./page.js"

const PATH = "/admin/merge/locations"
class MergeLocations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return this.page.locator('//h4[contains(text(),"Merge Locations")]').first()
  }

  async getLeftLocationField() {
    return this.page.locator("#Location1").first()
  }

  async getRightLocationField() {
    return this.page.locator("#Location2").first()
  }

  async getAdvancedSelectPopover() {
    return this.page.locator(".bp6-popover-content").first()
  }

  async getLocationHeaderFromPopover() {
    return this.page.locator('//table//th[contains(text(), "Name")]').first()
  }

  async getFirstItemFromAdvancedSelect() {
    return this.page
      .locator(
        ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) span"
      )
      .first()
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return this.page
      .locator(
        "table > tbody > tr:first-child > td:first-child > input.form-check-input"
      )
      .first()
  }

  async getMergeLocationsButton() {
    return this.page.locator('//button[text()="Merge Locations"]').first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return this.page.locator(`#mid-merge-loc-col ${button} > button`).first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await this.page
      .locator(`//div[@id="${side}-merge-loc-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (
      await this.getAdvancedSelectPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await (
      await this.getLocationHeaderFromPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect.bind(this),
      compareStr
    )
  }

  async getColumnContent(side, text) {
    return this.page
      .locator(
        `//div[@id="${side}-merge-loc-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async waitForColumnToChange(compareStr, side, text) {
    return this.waitForElementToChange(
      async () => this.getColumnContent(side, text),
      compareStr
    )
  }

  async waitForColumnToStartWith(compareStr, side, text) {
    await expect(await this.getColumnContent(side, text)).toContainText(
      compareStr,
      {
        useInnerText: true
      }
    )
  }

  async waitForSuccessAlert() {
    return this.waitForElementToChange(
      this.getAlertSuccess.bind(this),
      "Locations merged. Displaying merged Location below."
    )
  }

  async getField(fieldName) {
    return this.page.locator(`div[id="${fieldName}"]`).first()
  }

  async getFieldset(fieldName) {
    return (await this.getField(fieldName)).locator("fieldset").first()
  }
}
export default MergeLocations
