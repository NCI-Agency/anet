import Page from "./page.js"

const PAGE_URL = "/events"
class ShowAllEvents extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getEventsList() {
    await this.page.locator("#events fieldset tbody").first().waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page.locator("#events fieldset tbody > tr").all()
  }

  async getEventNames() {
    const elements = await this.page
      .locator("#events fieldset tbody > tr td:first-child span")
      .all()
    return Promise.all(elements.map(el => el.innerText()))
  }

  async getEventSeriesList() {
    await this.page.locator("#event-series fieldset tbody").first().waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page.locator("#event-series fieldset tbody > tr").all()
  }

  async getEventSeriesNames() {
    const elements = await this.page
      .locator("#event-series fieldset tbody > tr td:first-child span")
      .all()
    return Promise.all(elements.map(el => el.innerText()))
  }
}
export default ShowAllEvents
