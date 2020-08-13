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

  get myOrgLink() {
    return browser.$("#my-organization")
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
