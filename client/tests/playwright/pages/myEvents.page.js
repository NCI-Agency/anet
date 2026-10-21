import { currentPage, waitFor } from "../support.js"
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
    const firstEventSeries = await currentPage().locator(selector).first()
    await waitFor(firstEventSeries, "visible")
    return currentPage().locator(selector).all()
  }

  async getMyEvents() {
    const selector = "#my-events table tbody tr td:first-child"
    const firstEvent = await currentPage().locator(selector).first()
    await waitFor(firstEvent, "visible")
    return currentPage().locator(selector).all()
  }

  async selectEventsSummary() {
    const summaryTab = await currentPage()
      .locator(
        "#my-events .event-collection div header div button[value='summary']"
      )
      .first()
    await summaryTab.click()
    await super.waitUntilLoaded()
  }

  async getEventsSummaryItem(summaryItem) {
    return currentPage()
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
    const calendarTab = await currentPage()
      .locator(
        "#my-events .event-collection div header div button[value='calendar']"
      )
      .first()
    await calendarTab.click()
    await super.waitUntilLoaded()
  }

  async selectEventsMap() {
    const mapTab = await currentPage()
      .locator(
        "#my-events .event-collection div header div button[value='map']"
      )
      .first()
    await mapTab.click()
    await super.waitUntilLoaded()
  }
}

export default new MyEvents()
