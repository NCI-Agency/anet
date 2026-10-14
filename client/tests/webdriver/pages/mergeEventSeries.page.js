import Page from "./page.js"

const PATH = "/admin/merge/eventSeries"

class MergeEventSeries extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Event Series")]')
  }

  async getLeftEventSeriesField() {
    return browser.$("#EventSeries1")
  }

  async getRightEventSeriesField() {
    return browser.$("#EventSeries2")
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
      `//div[@id="${side}-merge-eventSeries-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getMergeEventSeriesButton() {
    return browser.$('//button[text()="Merge Event Series"]')
  }

  async getEventSeriesHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Name")]')
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-eventSeries-col"]//div[text()="${text}"]`
    )
    const button = await buttonDiv.parentElement().parentElement()
    return button.$("small > button")
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-eventSeries-col ${button} > button`)
  }

  async waitForAdvancedSelectLoading(compareStr, rowNumber = 1) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getEventSeriesHeaderFromPopover()).waitForExist()
    await (await this.getEventSeriesHeaderFromPopover()).waitForDisplayed()
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
    return browser.$("#fg-name #name")
  }

  async getDescription() {
    return browser.$("#description .editable p")
  }

  async getOwnerOrganization() {
    return browser.$("#ownerOrg")
  }

  async getAdminOrganization() {
    return browser.$("#adminOrg")
  }

  async getHosts() {
    return browser.$$("#hostRelatedObjects tbody tr")
  }

  async getHostNames() {
    const hosts = await this.getHosts()
    const hostNames = []

    for (const host of hosts) {
      hostNames.push(await host.getText())
    }

    return hostNames
  }
}

export default new MergeEventSeries()
