import Page from "./page"

class Home extends Page {
  get topbar() {
    return browser.$("#topbar")
  }

  get ieBanner() {
    return browser.$("#ieBanner")
  }

  get ieBannerText() {
    return this.ieBanner.$("div:nth-child(2)").getText()
  }

  get securityBanner() {
    const banner = browser.$("#topbar .banner div:nth-child(2)")
    banner.waitForExist()
    banner.waitForDisplayed()
    return banner
  }

  get searchBar() {
    return browser.$("#searchBarInput")
  }

  get homeTilesContainer() {
    return browser.$("fieldset.home-tile-row")
  }

  get pendingMyApprovalOfCount() {
    return browser
      .$('//button[contains(text(), "Reports pending my approval")]')
      .$("h1")
  }

  get submitSearch() {
    return browser.$("#topbar #searchBarSubmit")
  }

  get linksMenuButton() {
    return browser.$('//a[text()="My Work"]')
  }

  get myOrgLink() {
    return browser.$('//a//span[contains(text(), "My Organization")]')
  }

  get myTasksLink() {
    return browser.$('//a//span[text()="My Objective / Efforts"]')
  }

  get myCounterpartsLink() {
    return browser.$('//a//span[text()="My Counterparts"]')
  }

  get myCounterpartsNotifications() {
    return this.myCounterpartsLink.$("span.badge")
  }

  get myTasksNotifications() {
    return this.myTasksLink.$("span.badge")
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
