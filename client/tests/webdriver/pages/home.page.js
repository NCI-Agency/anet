import Page from "./page"

class Home extends Page {
  get topbar() {
    return browser.$("#topbar")
  }

  get ie11BannerText() {
    const ieBanner = browser.$("#ieBanner")
    ieBanner.waitForExist()
    ieBanner.waitForDisplayed()
    return browser.$("#ieBanner > div:nth-child(2)").getText()
  }

  get securityBanner() {
    return browser.$("#topbar .banner")
  }

  get searchBar() {
    return browser.$("#searchBarInput")
  }

  get submitSearch() {
    return browser.$("#topbar #searchBarSubmit")
  }

  get myOrgLink() {
    return browser.$("#my-organization")
  }

  get myTasksLink() {
    return browser.$("#my-tasks-nav")
  }

  get myCounterpartsLink() {
    return browser.$("#my-counterparts-nav")
  }

  waitForSecurityBannerValue(value) {
    this.securityBanner.waitForExist()
    this.securityBanner.waitForDisplayed()
    return browser.waitUntil(
      () => {
        return this.securityBanner.getText() === value
      },
      { timeout: 5000, timeoutMsg: "Expected different banner text after 5s" }
    )
  }
}

export default new Home()
