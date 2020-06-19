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
