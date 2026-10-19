import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/events"

class ShowAllEvents extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getEventsList() {
    await waitFor(
      currentPage().locator("#events fieldset tbody").first(),
      "visible"
    )
    return currentPage().locator("#events fieldset tbody > tr").all()
  }

  async getEventNames() {
    const elements = await currentPage()
      .locator("#events fieldset tbody > tr td:first-child span")
      .all()
    return Promise.all(elements.map(el => el.innerText()))
  }

  async getEventSeriesList() {
    await waitFor(
      currentPage().locator("#event-series fieldset tbody").first(),
      "visible"
    )
    return currentPage().locator("#event-series fieldset tbody > tr").all()
  }

  async getEventSeriesNames() {
    const elements = await currentPage()
      .locator("#event-series fieldset tbody > tr td:first-child span")
      .all()
    return Promise.all(elements.map(el => el.innerText()))
  }
}

export default new ShowAllEvents()
