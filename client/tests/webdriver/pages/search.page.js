import Page from "./page"

class Search extends Page {
  async getMain() {
    return browser.$("div#main-viewport")
  }

  async getNoResultsFound() {
    return browser.$('//div/b[text()="No search results found!"]')
  }

  async getFoundCounter(entity) {
    return browser.$(`div#${entity} span span`)
  }

  async getFoundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  async getFoundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
  }

  async getFoundOrganizationTable() {
    return browser.$("div#organizations #organizations-search-results")
  }

  async getFoundReportTable() {
    return browser.$("div#reports .report-collection")
  }

  async getFoundPositionTable() {
    return browser.$("div#positions #positions-search-results")
  }

  async getFoundLocationTable() {
    return browser.$("div#locations .location-collection")
  }

  async getFoundAuthorizationGroupTable() {
    return browser.$(
      "div#authorizationGroups #authorizationGroups-search-results"
    )
  }

  async getFoundEventTable() {
    return browser.$("div#events .event-collection")
  }

  async getFoundEventSeriesTable() {
    return browser.$("div#eventSeries #eventSeries-search-results")
  }

  async linkOfPersonFound(name) {
    return (await this.getFoundPeopleTable()).$(
      `.//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  async linkOfTaskFound(name) {
    return (await this.getFoundTaskTable()).$(
      `.//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  async linkOfOrganizationFound(name) {
    return (await this.getFoundOrganizationTable()).$(
      `.//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  async linkOfEventFound(name) {
    return (await this.getFoundEventTable()).$(
      `//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  async getReportTableButton() {
    return browser.$(".report-collection div header div button[value='table']")
  }

  async linkOfReportFound(linkText) {
    return browser.$(`*=${linkText}`)
  }

  async selectReportTable() {
    const tableTab = await this.getReportTableButton()
    await tableTab.waitForExist()
    await tableTab.waitForDisplayed()
    await tableTab.click()
  }

  async selectReport(linkText) {
    await this.selectReportTable()
    const reportLink = await this.linkOfReportFound(linkText)
    await reportLink.waitForExist()
    await reportLink.waitForDisplayed()
    await reportLink.click()
    await super.waitUntilLoaded()
  }
}

export default new Search()
