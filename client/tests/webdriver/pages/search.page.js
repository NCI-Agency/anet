import Page from "./page"

class Search extends Page {
  async getFoundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  async getFoundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
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

  async selectReport(linkText) {
    const tableTab = await browser.$(
      ".report-collection div header div button[value='table']"
    )
    await tableTab.waitForExist()
    await tableTab.waitForDisplayed()
    await tableTab.click()
    const reportLink = await browser.$(`*=${linkText}`)
    await reportLink.waitForExist()
    await reportLink.waitForDisplayed()
    await reportLink.click()
    await super.waitUntilLoaded()
  }
}

export default new Search()
