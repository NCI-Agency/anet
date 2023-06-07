import Page from "./page"

class Search extends Page {
  async getFoundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  async getFoundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
  }

  async getFoundReportTable() {
    return browser.$("div#reports .report-collection")
  }

  async linkOfPersonFound(name) {
    return (await this.getFoundPeopleTable()).$(
      `//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  async linkOfTaskFound(name) {
    return (await this.getFoundTaskTable()).$(
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
