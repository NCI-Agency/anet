import { expect } from "@playwright/test"
import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PATH = "/admin/merge/locations"

class MergeLocations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return currentPage()
      .locator('//h4[contains(text(),"Merge Locations")]')
      .first()
  }

  async getLeftLocationField() {
    return currentPage().locator("#Location1").first()
  }

  async getRightLocationField() {
    return currentPage().locator("#Location2").first()
  }

  async getAdvancedSelectPopover() {
    return currentPage().locator(".bp6-popover-content").first()
  }

  async getLocationHeaderFromPopover() {
    return currentPage()
      .locator('//table//th[contains(text(), "Name")]')
      .first()
  }

  async getFirstItemFromAdvancedSelect() {
    return currentPage()
      .locator(
        ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) span"
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

  async getMergeLocationsButton() {
    return currentPage().locator('//button[text()="Merge Locations"]').first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return currentPage()
      .locator(`#mid-merge-loc-col ${button} > button`)
      .first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await currentPage()
      .locator(`//div[@id="${side}-merge-loc-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await waitFor(await this.getAdvancedSelectPopover(), "visible")
    await waitFor(await this.getLocationHeaderFromPopover(), "visible")
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect,
      compareStr
    )
  }

  async getColumnContent(side, text) {
    return currentPage()
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
      this.getAlertSuccess,
      "Locations merged. Displaying merged Location below."
    )
  }

  async getField(fieldName) {
    return currentPage().locator(`div[id="${fieldName}"]`).first()
  }

  async getFieldset(fieldName) {
    return (await this.getField(fieldName)).locator("fieldset").first()
  }
}

export default new MergeLocations()
