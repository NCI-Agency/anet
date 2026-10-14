import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PATH = "/admin/merge/eventSeries"
class MergeEventSeries extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return currentPage()
      .locator('//h4[contains(text(),"Merge Event Series")]')
      .first()
  }

  async getLeftEventSeriesField() {
    return currentPage().locator("#EventSeries1").first()
  }

  async getRightEventSeriesField() {
    return currentPage().locator("#EventSeries2").first()
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
        `//div[@id="${side}-merge-eventSeries-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getMergeEventSeriesButton() {
    return currentPage()
      .locator('//button[text()="Merge Event Series"]')
      .first()
  }

  async getEventSeriesHeaderFromPopover() {
    return currentPage()
      .locator('//table//th[contains(text(), "Name")]')
      .first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await currentPage()
      .locator(
        `//div[@id="${side}-merge-eventSeries-col"]//div[text()="${text}"]`
      )
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return currentPage()
      .locator(`#mid-merge-eventSeries-col ${button} > button`)
      .first()
  }

  async waitForAdvancedSelectLoading(compareStr, rowNumber = 1) {
    await waitFor(await this.getAdvancedSelectPopover(), "attached")
    await waitFor(await this.getAdvancedSelectPopover(), "visible")
    await waitFor(await this.getEventSeriesHeaderFromPopover(), "attached")
    await waitFor(await this.getEventSeriesHeaderFromPopover(), "visible")
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
      this.getAlertSuccess,
      "Event series merged. Displaying merged event series below."
    )
  }

  async getName() {
    return currentPage().locator("#fg-name #name").first()
  }

  async getDescription() {
    return currentPage().locator("#description .editable p").first()
  }

  async getOwnerOrganization() {
    return currentPage().locator("#ownerOrg").first()
  }

  async getAdminOrganization() {
    return currentPage().locator("#adminOrg").first()
  }

  async getHosts() {
    return currentPage().locator("#hostRelatedObjects tbody tr").all()
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
export default new MergeEventSeries()
