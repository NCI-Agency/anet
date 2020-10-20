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

  get myTasksLink() {
    return browser.$("#my-tasks-nav")
  }

  get myCounterpartsLink() {
    return browser.$("#my-counterparts-nav")
  }

  get myCounterpartsNotifications() {
    return this.myCounterpartsLink.$("span:last-child")
  }

  get myTasksNotifications() {
    return this.myTasksLink.$("span:last-child")
  }

  get onboardingPopover() {
    return browser.$(".hopscotch-bubble-container")
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
