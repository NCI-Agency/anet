import Page from "./page.js"

const PATH = "/admin/merge/organizations"

class MergeOrganizations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Organizations")]')
  }

  async getLeftOrganizationField() {
    return browser.$("#Organization1")
  }

  async getRightOrganizationField() {
    return browser.$("#Organization2")
  }

  async getFirstItemFromAdvancedSelect() {
    return browser.$(
      ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
    )
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return browser.$(
      "table > tbody > tr:first-child > td:first-child > input.form-check-input"
    )
  }

  async getAdvancedSelectPopover() {
    return browser.$(".bp6-popover-content")
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-org-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getMergeOrganizationsButton() {
    return browser.$('//button[text()="Merge Organizations"]')
  }

  async getOrganizationHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Organization")]')
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-org-col"]//div[text()="${text}"]`
    )
    const button = await buttonDiv.parentElement().parentElement()
    return button.$("small > button")
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-org-col ${button} > button`)
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getOrganizationHeaderFromPopover()).waitForExist()
    await (await this.getOrganizationHeaderFromPopover()).waitForDisplayed()
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
