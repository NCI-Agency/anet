import Page from "./page.js"

const PAGE_URL = "/communities"

export default class ShowAllCommunities extends Page {
  /** @param {import("@playwright/test").Page} page */
  constructor(page) {
    super(page)
    this.communities = page.locator("#communities fieldset tbody > tr")
    this.communityNames = this.communities.locator("td:first-child span")
  }

  async open() {
    await super.open(PAGE_URL)
  }
}
