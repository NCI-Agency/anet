import Page from "../page"

const PAGE_URL = "/attachments/:uuid"
const EDIT_URL = "/attachments/:uuid/edit"

class ShowAttachment extends Page {
  async getEditAttachmentButton() {
    return browser.$(".btn")
  }

  async getDownloadAttachmentButton() {
    return browser.$("//a[text()='Download']")
  }

  async getNoContentButton() {
    return browser.$("//a[text()='Attachment has no content']")
  }

  async getImage() {
    return browser.$("#attachmentImage")
  }

  async getFilename() {
    return browser.$("#fileName")
  }

  async getCaption() {
    return browser.$("#caption")
  }

  async getContentLength() {
    return browser.$("#contentLength")
  }

  async getOwner() {
    return browser.$("//a[text()='CIV DMIN, Arthur']")
  }

  async getDescription() {
    return browser.$("#description")
  }

  async getEditDescription() {
    return browser.$(
      ".description > div:last-child > div > p > span > span > span"
    )
  }

  async getMimetype() {
    return browser.$("#mimeType")
  }

  async getClassification() {
    return browser.$("#classification")
  }

  async getUsedin() {
    return browser.$("//a[text()='A test report from Arthur']")
  }

  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openEdit(uuid) {
    await super.open(EDIT_URL.replace(":uuid", uuid))
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }
}

export default new ShowAttachment()
