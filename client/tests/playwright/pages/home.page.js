import Page from "./page.js"

class Home extends Page {
  async getTopbar() {
    return this.page.locator("#topbar").first()
  }

  async getIeBanner() {
    return this.page.locator("#ieBanner").first()
  }

  async getIeBannerText() {
    return (
      await (await this.getIeBanner()).locator("div:nth-child(2)").first()
    ).innerText()
  }

  async getSecurityBanner() {
    const banner = await this.page.locator("#topbar div:nth-child(1)").first()
    await banner.waitFor({
      state: "visible",
      timeout: 10000
    })
    return banner
  }

  async getBannerUser() {
    return (await this.getSecurityBanner()).locator("#bannerUser").first()
  }

  async getBannerSecurityText() {
    return (await this.getSecurityBanner())
      .locator("#bannerSecurityText")
      .first()
  }

  async getBannerDropdown() {
    return (await this.getBannerUser())
      .locator('button[id="dropdown-split-basic"]')
      .first()
  }

  async getLogoutButton() {
    return (await this.getBannerUser())
      .locator('xpath=.//a[text()="Sign out"]')
      .first()
  }

  async getLoginButton() {
    return this.page.locator('//a[text()="Sign In"]').first()
  }

  async getSearchBar() {
    return this.page.locator("#searchBarInput").first()
  }

  async getHomeTilesContainer() {
    return this.page.locator("fieldset.home-tile-row").first()
  }

  async getSubmitSearch() {
    return this.page.locator("#topbar #searchBarSubmit").first()
  }

  async getLinksMenuButton() {
    return this.page.locator('//a[text()="My Work"]').first()
  }

  async getMyReportsLink() {
    return this.page
      .locator('//a//span[contains(text(), "My Reports")]')
      .first()
  }

  async getMyOrgLink() {
    return this.page
      .locator('//a//span[contains(text(), "My Organization")]')
      .first()
  }

  async getMyTasksLink() {
    return this.page.locator('//a//span[text()="My Objectives"]').first()
  }

  async getMyCounterpartsLink() {
    return this.page.locator('//a//span[text()="My Counterparts"]').first()
  }

  async getMyAttachmentsLink() {
    return this.page.locator('//a//span[text()="My Attachments"]').first()
  }

  async getMyEventsLink() {
    return this.page.locator('//a//span[text()="My Events"]').first()
  }

  async getMyCounterpartsNotifications() {
    return (await this.getMyCounterpartsLink()).locator("span.badge").first()
  }

  async getMyTasksNotifications() {
    return (await this.getMyTasksLink()).locator("span.badge").first()
  }

  async getMyDraftReports() {
    return this.page
      .locator('//button[contains(text(), "My draft reports")]')
      .first()
  }

  async getMyDraftReportsCount() {
    return (await this.getMyDraftReports()).locator("h1").first()
  }

  async getReportsPendingMyApproval() {
    return this.page
      .locator('//button[text()="Reports pending my approval"]')
      .first()
  }

  async getReportsPendingMyApprovalCount() {
    return (await this.getReportsPendingMyApproval()).locator("h1").first()
  }

  async getSavedSearches() {
    return this.page.locator("fieldset.saved-searches").first()
  }

  async getSavedSearchRows() {
    return this.page.locator("div.saved-search-row")
  }
}
export default Home
