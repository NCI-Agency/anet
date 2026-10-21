import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PATH = "/admin/merge/tasks"

class MergeTasks extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return currentPage()
      .locator('//h4[contains(text(),"Merge Objectives")]')
      .first()
  }

  async getLeftTaskField() {
    return currentPage().locator("#Objective1").first()
  }

  async getRightTaskField() {
    return currentPage().locator("#Objective2").first()
  }

  async getItemFromAdvancedSelect(rowNumber = 1) {
    return currentPage()
      .locator(
        `.advanced-select-popover table > tbody > tr:nth-child(${rowNumber}) > td:nth-child(2) span`
      )
      .first()
  }

  async getItemRadioButtonFromAdvancedSelect(rowNumber = 1) {
    return currentPage()
      .locator(
        `table > tbody > tr:nth-child(${rowNumber}) > td:first-child > input.form-check-input`
      )
      .first()
  }

  async getAdvancedSelectPopover() {
    return currentPage().locator(".bp6-popover-content").first()
  }

  async getColumnContent(side, text) {
    return currentPage()
      .locator(
        `//div[@id="${side}-merge-task-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getMergeTasksButton() {
    return currentPage().locator('//button[text()="Merge Objectives"]').first()
  }

  async getTaskHeaderFromPopover() {
    return currentPage()
      .locator('//table//th[contains(text(), "Objective")]')
      .first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await currentPage()
      .locator(`//div[@id="${side}-merge-task-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return currentPage()
      .locator(`#mid-merge-task-col ${button} > button`)
      .first()
  }

  async waitForAdvancedSelectLoading(compareStr, rowNumber = 1) {
    await waitFor(await this.getAdvancedSelectPopover(), "visible")
    await waitFor(await this.getTaskHeaderFromPopover(), "visible")
    return this.waitForElementToChange(
      async () => this.getItemFromAdvancedSelect(rowNumber),
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
      "Objectives merged. Displaying merged Objective below."
    )
  }
}

export default new MergeTasks()
