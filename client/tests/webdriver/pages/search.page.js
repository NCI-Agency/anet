import Page from "./page"

class Search extends Page {
  get foundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  get foundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
  }

  linkOfPersonFound(name) {
    return this.foundPeopleTable.$(`//tbody/tr//a[contains(text(), "${name}")]`)
  }

  linkOfTaskFound(name) {
    return this.foundTaskTable.$(`//tbody/tr//a[contains(text(), "${name}")]`)
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
