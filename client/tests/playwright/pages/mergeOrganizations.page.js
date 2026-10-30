import Page from "./page.js"

const PATH = "/admin/merge/organizations"
class MergeOrganizations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return this.page
      .locator('//h4[contains(text(),"Merge Organizations")]')
      .first()
  }

  async getLeftOrganizationField() {
    return this.page.locator("#Organization1").first()
  }

  async getRightOrganizationField() {
    return this.page.locator("#Organization2").first()
  }

  async getFirstItemFromAdvancedSelect() {
    return this.page
      .locator(
        ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
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

  async getAdvancedSelectPopover() {
    return this.page.locator(".bp6-popover-content").first()
  }

  async getColumnContent(side, text) {
    return this.page
      .locator(
        `//div[@id="${side}-merge-org-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getMergeOrganizationsButton() {
    return this.page.locator('//button[text()="Merge Organizations"]').first()
  }

  async getOrganizationHeaderFromPopover() {
    return this.page
      .locator('//table//th[contains(text(), "Organization")]')
      .first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await this.page
      .locator(`//div[@id="${side}-merge-org-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return this.page.locator(`#mid-merge-org-col ${button} > button`).first()
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (
      await this.getAdvancedSelectPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await (
      await this.getOrganizationHeaderFromPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect.bind(this),
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
      "Organizations merged. Displaying merged Organization below."
    )
  }
}
export default MergeOrganizations
