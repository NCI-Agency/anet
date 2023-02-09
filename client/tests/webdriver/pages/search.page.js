import Page from "./page"

class Search extends Page {
  getFoundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  getFoundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
  }

  linkOfPersonFound(name) {
    return this.getFoundPeopleTable().$(
      `//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  linkOfTaskFound(name) {
    return this.getFoundTaskTable().$(
      `//tbody/tr//a[contains(text(), "${name}")]`
    )
  }

  selectReport(linkText) {
    const tableTab = browser.$(
      ".report-collection div header div button[value='table']"
    )
    tableTab.waitForExist()
    tableTab.waitForDisplayed()
    tableTab.click()
    const reportLink = browser.$(`*=${linkText}`)
    reportLink.waitForExist()
    reportLink.waitForDisplayed()
    reportLink.click()
    super.waitUntilLoaded()
  }
}

export default new Search()
