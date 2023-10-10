import Page from "../page"

const PAGE_URL = "/locations/:uuid"

class ShowLocation extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async getEditButton() {
    return browser.$('//a[text()="Edit"]')
  }

  async getSuccessMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  async getLatField() {
    return browser.$('div[name="location"] span:first-child')
  }

  async getLngField() {
    return browser.$('div[name="location"] span:nth-child(3)')
  }
}
export default new ShowLocation()
