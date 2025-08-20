import Page from "./page"

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
      `.advanced-select-popover table > tbody > tr:nth-child(${rowNumber}) > td:nth-child(2) > span`
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
    const button = await (await buttonDiv.$("..")).$("..")
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

    await browser.waitUntil(
      async () => {
        return (
          (await (
            await this.getItemFromAdvancedSelect(rowNumber)
          ).getText()) === compareStr
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched task in time"
      }
    )
  }

  async waitForColumnToChange(compareStr, side, text) {
    const field = await this.getColumnContent(side, text)

    await browser.waitUntil(
      async () => {
        return (await field.getText()) === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't set the task in time"
      }
    )
  }

  async waitForSuccessAlert() {
    await browser.waitUntil(
      async () => {
        return (
          (await (await browser.$(".alert-success")).getText()) ===
          "Objectives merged. Displaying merged Objective below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
  }
}

export default new MergeTasks()
