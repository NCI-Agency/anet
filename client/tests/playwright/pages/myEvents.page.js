import Page from "./page.js"

const PAGE_URL = "/events/mine"
class MyEvents extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getMyEventSeries() {
    const selector = "#my-event-series table tbody tr td:first-child"
    const firstEventSeries = await this.page.locator(selector).first()
    await firstEventSeries.waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page.locator(selector).all()
  }

  async getMyEvents() {
    const selector = "#my-events table tbody tr td:first-child"
    const firstEvent = await this.page.locator(selector).first()
    await firstEvent.waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page.locator(selector).all()
  }

  async selectEventsSummary() {
    const summaryTab = await this.page
      .locator(
        "#my-events .event-collection div header div button[value='summary']"
      )
      .first()
    await summaryTab.click()
    await super.waitUntilLoaded()
  }

  async getEventsSummaryItem(summaryItem) {
    return this.page
      .locator(
        `#my-events .event-collection .event-summary:nth-child(${summaryItem})`
      )
      .first()
  }

  async getEventSummaryLine(summaryItem, summaryLine) {
    return (await this.getEventsSummaryItem(summaryItem))
      .locator(`div:nth-child(${summaryLine})`)
      .first()
  }

  async getEventSummarySpan(summaryItem, summaryLine, infoSpan) {
    return (await this.getEventSummaryLine(summaryItem, summaryLine))
      .locator(`span:nth-child(${infoSpan})`)
      .first()
  }

  async selectEventsCalendar() {
    const calendarTab = await this.page
      .locator(
        "#my-events .event-collection div header div button[value='calendar']"
      )
      .first()
    await calendarTab.click()
    await super.waitUntilLoaded()
  }

  async selectEventsMap() {
    const mapTab = await this.page
      .locator(
        "#my-events .event-collection div header div button[value='map']"
      )
      .first()
    await mapTab.click()
    await super.waitUntilLoaded()
  }
}
export default MyEvents
