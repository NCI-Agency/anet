import Page from "../page"

const PAGE_URL = "/locations/:uuid"

class ShowLocation extends Page {
  open(uuid) {
    super.open(PAGE_URL.replace(":uuid", uuid))
  }

  getEditButton() {
    return browser.$('//a[text()="Edit"]')
  }

  getSuccessMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  getLatField() {
    return browser.$('div[name="location"] span:first-child')
  }

  getLngField() {
    return browser.$('div[name="location"] span:nth-child(3)')
  }
}
export default new ShowLocation()
