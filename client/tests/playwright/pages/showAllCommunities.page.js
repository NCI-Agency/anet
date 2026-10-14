import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/communities"
class ShowAllCommunities extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getCommunitiesList() {
    await waitFor(
      currentPage().locator("#communities fieldset tbody").first(),
      "visible"
    )
    return currentPage().locator("#communities fieldset tbody > tr").all()
  }

  async getCommunitiesNames() {
    const elements = await currentPage()
      .locator("#communities fieldset tbody > tr td:first-child span")
      .all()
    return Promise.all(elements.map(el => el.innerText()))
  }
}
export default new ShowAllCommunities()
