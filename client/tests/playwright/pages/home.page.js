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
      .getByRole("link", { name: "Sign out", exact: true })
      .first()
  }

  async getLoginButton() {
    return this.page.getByRole("link", { name: "Sign In", exact: true }).first()
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
    return this.page
      .getByRole("button", { name: "My Work", exact: true })
      .first()
  }

  async getMyReportsLink() {
    return this.page
      .getByRole("link", { name: "My Reports", exact: false })
      .first()
  }

  async getMyOrgLink() {
    return this.page
      .getByRole("link", { name: "My Organization", exact: false })
      .first()
  }

  async getMyTasksLink() {
    return this.page
      .getByRole("link", { name: "My Objectives", exact: false })
      .first()
  }

  async getMyCounterpartsLink() {
    return this.page
      .getByRole("link", { name: "My Counterparts", exact: false })
      .first()
  }

  async getMyAttachmentsLink() {
    return this.page
      .getByRole("link", { name: "My Attachments", exact: true })
      .first()
  }

  async getMyEventsLink() {
    return this.page
      .getByRole("link", { name: "My Events", exact: true })
      .first()
  }

  async getMyCounterpartsNotifications() {
    return (await this.getMyCounterpartsLink()).locator("span.badge").first()
  }

  async getMyTasksNotifications() {
    return (await this.getMyTasksLink()).locator("span.badge").first()
  }

  async getMyDraftReports() {
    return this.page
      .getByRole("button", { name: "My draft reports", exact: false })
      .first()
  }

  async getMyDraftReportsCount() {
    return (await this.getMyDraftReports()).locator("h1").first()
  }

  async getReportsPendingMyApproval() {
    // HomeTile includes the live report count in the button's accessible name.
    return (await this.getHomeTilesContainer()).getByRole("button", {
      name: /^(?:\d+\s*)?Reports pending my approval$/
    })
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
