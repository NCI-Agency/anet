import Page from "./page.js"

const PAGE_URL = "/events"

class ShowAllEvents extends Page {
  /** @param {import("@playwright/test").Page} page */
  constructor(page) {
    super(page)
    this.events = page.locator("#events fieldset tbody > tr")
    this.eventNames = this.events.locator("td:first-child span")
    this.eventSeries = page.locator("#event-series fieldset tbody > tr")
    this.eventSeriesNames = this.eventSeries.locator("td:first-child span")
  }

  async open() {
    await super.open(PAGE_URL)
  }
}

export default ShowAllEvents
