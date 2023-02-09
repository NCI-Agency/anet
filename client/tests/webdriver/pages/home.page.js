import Page from "./page"

class Home extends Page {
  getTopbar() {
    return browser.$("#topbar")
  }

  getIeBanner() {
    return browser.$("#ieBanner")
  }

  getIeBannerText() {
    return this.getIeBanner().$("div:nth-child(2)").getText()
  }

  getSecurityBanner() {
    const banner = browser.$("#topbar div:nth-child(1)")
    banner.waitForExist()
    banner.waitForDisplayed()
    return banner
  }

  getBannerUser() {
    return this.getSecurityBanner().$("#bannerUser")
  }

  getBannerSecurityText() {
    return this.getSecurityBanner().$("#bannerSecurityText")
  }

  getBannerDropdown() {
    return this.getBannerUser().$('button[id="dropdown-split-basic"]')
  }

  getLogoutButton() {
    return this.getBannerUser().$('//a[text()="Sign out"]')
  }

  getSearchBar() {
    return browser.$("#searchBarInput")
  }

  getHomeTilesContainer() {
    return browser.$("fieldset.home-tile-row")
  }

  getPendingMyApprovalOfCount() {
    return browser
      .$('//button[contains(text(), "Reports pending my approval")]')
      .$("h1")
  }

  getSubmitSearch() {
    return browser.$("#topbar #searchBarSubmit")
  }

  getLinksMenuButton() {
    return browser.$('//a[text()="My Work"]')
  }

  getMyOrgLink() {
    return browser.$('//a//span[contains(text(), "My Organization")]')
  }

  getMyTasksLink() {
    return browser.$('//a//span[text()="My Objective / Efforts"]')
  }

  getMyCounterpartsLink() {
    return browser.$('//a//span[text()="My Counterparts"]')
  }

  getMyCounterpartsNotifications() {
    return this.getMyCounterpartsLink().$("span.badge")
  }

  getMyTasksNotifications() {
    return this.getMyTasksLink().$("span.badge")
  }

  getReportsPendingMyApproval() {
    return browser.$('//button[text()="Reports pending my approval"]')
  }

  waitForSecurityBannerValue(value) {
    this.getSecurityBanner().waitForExist()
    this.getSecurityBanner().waitForDisplayed()
    return browser.waitUntil(
      () => {
        return this.getSecurityBanner().getText() === value
      },
      { timeout: 5000, timeoutMsg: "Expected different banner text after 5s" }
    )
  }
}

export default new Home()
