import Page from "./page.js"

class Search extends Page {
  async getMain() {
    return this.page.locator("div#main-viewport").first()
  }

  async getNoResultsFound() {
    return this.page
      .locator('//div/b[text()="No search results found!"]')
      .first()
  }

  async getFoundCounter(entity) {
    return this.page.locator(`div#${entity} span span`).first()
  }

  async getFoundPeopleTable() {
    return this.page.locator("div#people #people-search-results").first()
  }

  async getFoundTaskTable() {
    return this.page.locator("div#tasks #tasks-search-results").first()
  }

  async getFoundOrganizationTable() {
    return this.page
      .locator("div#organizations #organizations-search-results")
      .first()
  }

  async getFoundReportTable() {
    return this.page.locator("div#reports .report-collection").first()
  }

  async getFoundPositionTable() {
    return this.page.locator("div#positions #positions-search-results").first()
  }

  async getFoundLocationTable() {
    return this.page.locator("div#locations .location-collection").first()
  }

  async getFoundAuthorizationGroupTable() {
    return this.page
      .locator("div#authorizationGroups #authorizationGroups-search-results")
      .first()
  }

  async getFoundEventTable() {
    return this.page.locator("div#events .event-collection").first()
  }

  async getFoundEventSeriesTable() {
    return this.page
      .locator("div#eventSeries #eventSeries-search-results")
      .first()
  }

  async linkOfPersonFound(name) {
    return (await this.getFoundPeopleTable())
      .locator(`xpath=.//tbody/tr//a[contains(text(), "${name}")]`)
      .first()
  }

  async linkOfTaskFound(name) {
    return (await this.getFoundTaskTable())
      .locator(`xpath=.//tbody/tr//a[contains(text(), "${name}")]`)
      .first()
  }

  async linkOfOrganizationFound(name) {
    return (await this.getFoundOrganizationTable())
      .locator(`xpath=.//tbody/tr//a[contains(text(), "${name}")]`)
      .first()
  }

  async linkOfEventFound(name) {
    return (await this.getFoundEventTable())
      .locator(`//tbody/tr//a[contains(text(), "${name}")]`)
      .first()
  }

  async getReportTableButton() {
    return this.page
      .locator(".report-collection div header div button[value='table']")
      .first()
  }

  async linkOfReportFound(linkText) {
    return this.page
      .getByText(`${linkText}`, {
        exact: true
      })
      .first()
  }

  async selectReportTable() {
    const tableTab = this.getReportTableButton()
    await (await tableTab).click()
    await super.waitUntilLoaded()
    // wait for table to load/render
  }

  async selectReport(linkText) {
    await this.selectReportTable()
    const reportLink = this.linkOfReportFound(linkText)
    await (await reportLink).click()
    await super.waitUntilLoaded()
  }
}
export default Search
