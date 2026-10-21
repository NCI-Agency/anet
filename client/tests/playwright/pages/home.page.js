import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

class Home extends Page {
  async getTopbar() {
    return currentPage().locator("#topbar").first()
  }

  async getIeBanner() {
    return currentPage().locator("#ieBanner").first()
  }

  async getIeBannerText() {
    return (
      await (await this.getIeBanner()).locator("div:nth-child(2)").first()
    ).innerText()
  }

  async getSecurityBanner() {
    const banner = await currentPage()
      .locator("#topbar div:nth-child(1)")
      .first()
    await waitFor(banner, "visible")
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
    return currentPage().locator('//a[text()="Sign In"]').first()
  }

  async getSearchBar() {
    return currentPage().locator("#searchBarInput").first()
  }

  async getHomeTilesContainer() {
    return currentPage().locator("fieldset.home-tile-row").first()
  }

  async getSubmitSearch() {
    return currentPage().locator("#topbar #searchBarSubmit").first()
  }

  async getLinksMenuButton() {
    return currentPage().locator('//a[text()="My Work"]').first()
  }

  async getMyReportsLink() {
    return currentPage()
      .locator('//a//span[contains(text(), "My Reports")]')
      .first()
  }

  async getMyOrgLink() {
    return currentPage()
      .locator('//a//span[contains(text(), "My Organization")]')
      .first()
  }

  async getMyTasksLink() {
    return currentPage().locator('//a//span[text()="My Objectives"]').first()
  }

  async getMyCounterpartsLink() {
    return currentPage().locator('//a//span[text()="My Counterparts"]').first()
  }

  async getMyAttachmentsLink() {
    return currentPage().locator('//a//span[text()="My Attachments"]').first()
  }

  async getMyEventsLink() {
    return currentPage().locator('//a//span[text()="My Events"]').first()
  }

  async getMyCounterpartsNotifications() {
    return (await this.getMyCounterpartsLink()).locator("span.badge").first()
  }

  async getMyTasksNotifications() {
    return (await this.getMyTasksLink()).locator("span.badge").first()
  }

  async getMyDraftReports() {
    return currentPage()
      .locator('//button[contains(text(), "My draft reports")]')
      .first()
  }

  async getMyDraftReportsCount() {
    return (await this.getMyDraftReports()).locator("h1").first()
  }

  async getReportsPendingMyApproval() {
    return currentPage()
      .locator('//button[text()="Reports pending my approval"]')
      .first()
  }

  async getReportsPendingMyApprovalCount() {
    return (await this.getReportsPendingMyApproval()).locator("h1").first()
  }

  async getSavedSearches() {
    return currentPage().locator("fieldset.saved-searches").first()
  }

  async getSavedSearchRows() {
    return currentPage().locator("div.saved-search-row")
  }
}

export default new Home()
