import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

class Search extends Page {
  async getMain() {
    return currentPage().locator("div#main-viewport").first()
  }

  async getNoResultsFound() {
    return currentPage()
      .locator('//div/b[text()="No search results found!"]')
      .first()
  }

  async getFoundCounter(entity) {
    return currentPage().locator(`div#${entity} span span`).first()
  }

  async getFoundPeopleTable() {
    return currentPage().locator("div#people #people-search-results").first()
  }

  async getFoundTaskTable() {
    return currentPage().locator("div#tasks #tasks-search-results").first()
  }

  async getFoundOrganizationTable() {
    return currentPage()
      .locator("div#organizations #organizations-search-results")
      .first()
  }

  async getFoundReportTable() {
    return currentPage().locator("div#reports .report-collection").first()
  }

  async getFoundPositionTable() {
    return currentPage()
      .locator("div#positions #positions-search-results")
      .first()
  }

  async getFoundLocationTable() {
    return currentPage().locator("div#locations .location-collection").first()
  }

  async getFoundAuthorizationGroupTable() {
    return currentPage()
      .locator("div#authorizationGroups #authorizationGroups-search-results")
      .first()
  }

  async getFoundEventTable() {
    return currentPage().locator("div#events .event-collection").first()
  }

  async getFoundEventSeriesTable() {
    return currentPage()
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
    return currentPage()
      .locator(".report-collection div header div button[value='table']")
      .first()
  }

  async linkOfReportFound(linkText) {
    return currentPage()
      .getByText(`${linkText}`, {
        exact: true
      })
      .first()
  }

  async selectReportTable() {
    const tableTab = this.getReportTableButton()
    await waitFor(await tableTab, "attached")
    await waitFor(await tableTab, "visible")
    await (await tableTab).click()
    await super.waitUntilLoaded()
    // wait for table to load/render
  }

  async selectReport(linkText) {
    await this.selectReportTable()
    const reportLink = this.linkOfReportFound(linkText)
    await waitFor(await reportLink, "attached")
    await waitFor(await reportLink, "visible")
    await (await reportLink).click()
    await super.waitUntilLoaded()
  }
}
export default new Search()
