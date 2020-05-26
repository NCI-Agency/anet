import Page from "./page"

class Home extends Page {
  get topbar() {
    return browser.$("#topbar")
  }

  get securityBanner() {
    const banner = browser.$("#topbar .banner")
    banner.waitForExist()
    banner.waitForDisplayed()
    return banner
  }

  get searchBar() {
    return browser.$("#searchBarInput")
  }

  get submitSearch() {
    return browser.$("#topbar #searchBarSubmit")
  }
}

export default new Home()
