import Page from "./page"

const PAGE_URL = "/communities"

class ShowAllCommunities extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getCommunitiesList() {
    await browser.$("#communities fieldset tbody").waitForDisplayed()
    return browser.$$("#communities fieldset tbody > tr")
  }

  async getCommunitiesNames() {
    const elements = await browser.$$(
      "#communities fieldset tbody > tr td:first-child span"
    )
    return elements.map(el => el.getText())
  }
}

export default new ShowAllCommunities()
