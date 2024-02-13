import Page from "./page"

class Home extends Page {
  async getTopbar() {
    return browser.$("#topbar")
  }

  async getIeBanner() {
    return browser.$("#ieBanner")
  }

  async getIeBannerText() {
    return (await (await this.getIeBanner()).$("div:nth-child(2)")).getText()
  }

  async getSecurityBanner() {
    const banner = await browser.$("#topbar div:nth-child(1)")
    await banner.waitForExist()
    await banner.waitForDisplayed()
    return banner
  }

  async getBannerUser() {
    return (await this.getSecurityBanner()).$("#bannerUser")
  }

  async getBannerSecurityText() {
    return (await this.getSecurityBanner()).$("#bannerSecurityText")
  }

  async getBannerDropdown() {
    return (await this.getBannerUser()).$('button[id="dropdown-split-basic"]')
  }

  async getLogoutButton() {
    return (await this.getBannerUser()).$('//a[text()="Sign out"]')
  }

  async getLoginButton() {
    return browser.$('//a[text()="Sign In"]')
  }

  async getSearchBar() {
    return browser.$("#searchBarInput")
  }

  async getHomeTilesContainer() {
    return browser.$("fieldset.home-tile-row")
  }

  async getSubmitSearch() {
    return browser.$("#topbar #searchBarSubmit")
  }

  async getLinksMenuButton() {
    return browser.$('//a[text()="My Work"]')
  }

  async getMyOrgLink() {
    return browser.$('//a//span[contains(text(), "My Organization")]')
  }

  async getMyTasksLink() {
    return browser.$('//a//span[text()="My Objective / Efforts"]')
  }

  async getMyCounterpartsLink() {
    return browser.$('//a//span[text()="My Counterparts"]')
  }

  async getMyCounterpartsNotifications() {
    return (await this.getMyCounterpartsLink()).$("span.badge")
  }

  async getMyTasksNotifications() {
    return (await this.getMyTasksLink()).$("span.badge")
  }

  async getMyDraftReports() {
    return browser.$('//button[contains(text(), "My draft reports")]')
  }

  async getMyDraftReportsCount() {
    return (await this.getMyDraftReports()).$("h1")
  }

  async getReportsPendingMyApproval() {
    return browser.$('//button[text()="Reports pending my approval"]')
  }

  async getReportsPendingMyApprovalCount() {
    return (await this.getReportsPendingMyApproval()).$("h1")
  }

  async waitForSecurityBannerValue(value) {
    await (await this.getSecurityBanner()).waitForExist()
    await (await this.getSecurityBanner()).waitForDisplayed()
    return browser.waitUntil(
      async() => {
        return (await (await this.getSecurityBanner()).getText()) === value
      },
      { timeout: 5000, timeoutMsg: "Expected different banner text after 5s" }
    )
  }
}

export default new Home()
