import Page from "./page.js"

const PATH = "/admin/merge/tasks"

class MergeTasks extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Objectives")]')
  }

  async getLeftTaskField() {
    return browser.$("#Objective1")
  }

  async getRightTaskField() {
    return browser.$("#Objective2")
  }

  async getItemFromAdvancedSelect(rowNumber = 1) {
    return browser.$(
      `.advanced-select-popover table > tbody > tr:nth-child(${rowNumber}) > td:nth-child(2) span`
    )
  }

  async getItemRadioButtonFromAdvancedSelect(rowNumber = 1) {
    return browser.$(
      `table > tbody > tr:nth-child(${rowNumber}) > td:first-child > input.form-check-input`
    )
  }

  async getAdvancedSelectPopover() {
    return browser.$(".bp6-popover-content")
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-task-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getMergeTasksButton() {
    return browser.$('//button[text()="Merge Objectives"]')
  }

  async getTaskHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Objective")]')
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-task-col"]//div[text()="${text}"]`
    )
    const button = await buttonDiv.parentElement().parentElement()
    return button.$("small > button")
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-task-col ${button} > button`)
  }

  async waitForAdvancedSelectLoading(compareStr, rowNumber = 1) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getTaskHeaderFromPopover()).waitForExist()
    await (await this.getTaskHeaderFromPopover()).waitForDisplayed()
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
