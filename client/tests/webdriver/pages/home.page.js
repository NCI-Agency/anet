import Page from "./page"

class Home extends Page {
  get topbar() {
    return browser.$("#topbar")
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

  waitForSecurityBannerValue(value) {
    this.securityBanner.waitForExist()
    this.securityBanner.waitForDisplayed()
    return browser.waitUntil(
      () => {
        return this.securityBanner.getText() === value
      },
      5000,
      "Expected different banner text after 5s"
    )
  }
}

export default new Home()
