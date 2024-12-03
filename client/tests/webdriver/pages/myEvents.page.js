import Page from "./page"

const PAGE_URL = "/events/mine"

class MyEvents extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async openAs(user) {
    await super.open(PAGE_URL, user)
  }

  async openAsOnboardUser() {
    await super.openAsOnboardUser(PAGE_URL)
  }

  async getMyEventSeries() {
    return browser.$("#my-event-series")
  }

  async getMyEvents() {
    return browser.$("#my-events")
  }

  async selectEventsSummary() {
    const summaryTab = await browser.$(
      "#my-events .event-collection div header div button[value='summary']"
    )
    await summaryTab.waitForExist()
    await summaryTab.waitForDisplayed()
    await summaryTab.click()
    await super.waitUntilLoaded()
  }

  async getEventsSummaryItem(summaryItem) {
    return browser.$(
      `#my-events .event-collection .event-summary:nth-child(${summaryItem})`
    )
  }

  async getEventSummaryLine(summaryItem, summaryLine) {
    return (await this.getEventsSummaryItem(summaryItem)).$(
      `div:nth-child(${summaryLine})`
    )
  }

  async getEventSummarySpan(summaryItem, summaryLine, infoSpan) {
    return (await this.getEventSummaryLine(summaryItem, summaryLine)).$(
      `span:nth-child(${infoSpan})`
    )
  }

  async selectEventsCalendar() {
    const calendarTab = await browser.$(
      "#my-events .event-collection div header div button[value='calendar']"
    )
    await calendarTab.waitForExist()
    await calendarTab.waitForDisplayed()
    await calendarTab.click()
    await super.waitUntilLoaded()
  }

  async selectEventsMap() {
    const matrixTab = await browser.$(
      "#my-events .event-collection div header div button[value='map']"
    )
    await matrixTab.waitForExist()
    await matrixTab.waitForDisplayed()
    await matrixTab.click()
    await super.waitUntilLoaded()
  }

  async selectEventsMatrix() {
    const matrixTab = await browser.$(
      "#my-events .event-collection div header div button[value='matrix']"
    )
    await matrixTab.waitForExist()
    await matrixTab.waitForDisplayed()
    await matrixTab.click()
    await super.waitUntilLoaded()
  }

  async getEventsMatrixItem(summaryItem) {
    return browser.$("#my-events .event-collection .event-matrix")
  }
}

export default new MyEvents()
