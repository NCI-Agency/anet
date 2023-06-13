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

  async getAttachments() {
    return browser.$("#attachments")
  }

  async getCard() {
    return browser.$(".card")
  }

  async getFileData() {
    return (await browser.$(".info-line")).getText()
  }

  async getImageClick() {
    return browser.$(".imagePreview")
  }
}
export default new ShowLocation()
