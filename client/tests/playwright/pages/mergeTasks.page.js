import Page from "./page.js"

const PATH = "/admin/merge/tasks"

class MergeTasks extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return this.page
      .getByRole("heading", {
        name: "Merge Objectives",
        level: 4,
        exact: false
      })
      .first()
  }

  async getLeftTaskField() {
    return this.page.locator("#Objective1").first()
  }

  async getRightTaskField() {
    return this.page.locator("#Objective2").first()
  }

  async getItemFromAdvancedSelect(rowNumber = 1) {
    return this.page
      .locator(
        `.advanced-select-popover table > tbody > tr:nth-child(${rowNumber}) > td:nth-child(2) span`
      )
      .first()
  }

  async getItemRadioButtonFromAdvancedSelect(rowNumber = 1) {
    return this.page
      .locator(
        `table > tbody > tr:nth-child(${rowNumber}) > td:first-child > input.form-check-input`
      )
      .first()
  }

  async getAdvancedSelectPopover() {
    return this.page.locator(".bp6-popover-content").first()
  }

  async getColumnContent(side, text) {
    return this.getMergeField(`${side}-merge-task-col`, text)
      .locator(":scope > div > div:nth-child(2)")
      .first()
  }

  async getMergeTasksButton() {
    return this.page
      .getByRole("button", { name: "Merge Objectives", exact: true })
      .first()
  }

  async getTaskHeaderFromPopover() {
    return this.page.getByRole("columnheader", { name: "Objective" }).first()
  }

  async getSelectButton(side, text) {
    return this.getMergeField(`${side}-merge-task-col`, text)
      .locator(":scope > small")
      .getByRole("button")
      .first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return this.page.locator(`#mid-merge-task-col ${button} > button`).first()
  }

  async waitForAdvancedSelectLoading(compareStr, rowNumber = 1) {
    await (
      await this.getAdvancedSelectPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await (
      await this.getTaskHeaderFromPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
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
      this.getAlertSuccess.bind(this),
      "Objectives merged. Displaying merged Objective below."
    )
  }
}

export default MergeTasks
