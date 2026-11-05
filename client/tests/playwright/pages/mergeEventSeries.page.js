import Page from "./page.js"

const PATH = "/admin/merge/eventSeries"

class MergeEventSeries extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return this.page
      .getByRole("heading", {
        name: "Merge Event Series",
        level: 4,
        exact: false
      })
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
    return this.getMergeField(`${side}-merge-eventSeries-col`, text)
      .locator(":scope > div > div:nth-child(2)")
      .first()
  }

  async getMergeEventSeriesButton() {
    return this.page
      .getByRole("button", { name: "Merge Event Series", exact: true })
      .first()
  }

  async getEventSeriesHeaderFromPopover() {
    return this.page.getByRole("columnheader", { name: "Name" }).first()
  }

  async getSelectButton(side, text) {
    return this.getMergeField(`${side}-merge-eventSeries-col`, text)
      .locator(":scope > small")
      .getByRole("button")
      .first()
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
