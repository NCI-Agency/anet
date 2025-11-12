import Page from "./page"

const PAGE_URL = "/events"

class ShowAllEvents extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getEventsList() {
    await browser.$("#events fieldset tbody").waitForDisplayed()
    return browser.$$("#events fieldset tbody > tr")
  }

  async getEventNames() {
    const elements = await browser.$$(
      "#events fieldset tbody > tr td:first-child span"
    )
    return elements.map(el => el.getText())
  }

  async getEventSeriesList() {
    await browser.$("#event-series fieldset tbody").waitForDisplayed()
    return browser.$$("#event-series fieldset tbody > tr")
  }

  async getEventSeriesNames() {
    const elements = await browser.$$(
      "#event-series fieldset tbody > tr td:first-child span"
    )
    return elements.map(el => el.getText())
  }
}

export default new ShowAllEvents()
