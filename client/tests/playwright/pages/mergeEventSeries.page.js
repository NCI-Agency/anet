import Page from "./page.js"

const PATH = "/admin/merge/eventSeries"
class MergeEventSeries extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return this.page
      .locator('//h4[contains(text(),"Merge Event Series")]')
      .first()
  }

  async getLeftEventSeriesField() {
    return this.page.locator("#EventSeries1").first()
  }

  async getRightEventSeriesField() {
    return this.page.locator("#EventSeries2").first()
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
    return this.page
      .locator(
        `//div[@id="${side}-merge-eventSeries-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getMergeEventSeriesButton() {
    return this.page.locator('//button[text()="Merge Event Series"]').first()
  }

  async getEventSeriesHeaderFromPopover() {
    return this.page.locator('//table//th[contains(text(), "Name")]').first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await this.page
      .locator(
        `//div[@id="${side}-merge-eventSeries-col"]//div[text()="${text}"]`
      )
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return this.page
      .locator(`#mid-merge-eventSeries-col ${button} > button`)
      .first()
  }

  async waitForAdvancedSelectLoading(compareStr, rowNumber = 1) {
    await (
      await this.getAdvancedSelectPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await (
      await this.getEventSeriesHeaderFromPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.waitForElementToChange(
      () => this.getItemFromAdvancedSelect(rowNumber),
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
      "Event series merged. Displaying merged event series below."
    )
  }

  async getName() {
    return this.page.locator("#fg-name #name").first()
  }

  async getDescription() {
    return this.page.locator("#description .editable p").first()
  }

  async getOwnerOrganization() {
    return this.page.locator("#ownerOrg").first()
  }

  async getAdminOrganization() {
    return this.page.locator("#adminOrg").first()
  }

  async getHosts() {
    return this.page.locator("#hostRelatedObjects tbody tr").all()
  }

  async getHostNames() {
    const hosts = await this.getHosts()
    const hostNames = []
    for (const host of hosts) {
      hostNames.push((await host.innerText()).trim())
    }
    return hostNames
  }
}
export default MergeEventSeries
