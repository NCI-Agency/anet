import Page from "../page"

const PAGE_URL = "/locations/:uuid"

class ShowLocation extends Page {
  open(uuid) {
    super.open(PAGE_URL.replace(":uuid", uuid))
  }

  get editButton() {
    return browser.$('//a[text()="Edit"]')
  }

  get successMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  get latField() {
    return browser.$('div[name="location"] span:first-child')
  }

  get lngField() {
    return browser.$('div[name="location"] span:nth-child(3)')
  }
}
export default new ShowLocation()
