const PAGE_URL = "/communities"
export default class ShowAllCommunities {
  /** @param {import("@playwright/test").Page} page */
  constructor(page) {
    this.page = page
    this.communities = page.locator("#communities fieldset tbody > tr")
    this.communityNames = this.communities.locator("td:first-child span")
  }

  async open() {
    await this.page.goto(PAGE_URL)
  }
}
