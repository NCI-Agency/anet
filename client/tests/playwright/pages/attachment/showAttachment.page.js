import { currentPage } from "../../support.js"
import Page from "../page.js"

const PAGE_URL = "/attachments/:uuid"
const EDIT_URL = "/attachments/:uuid/edit"

class ShowAttachment extends Page {
  async getEditAttachmentButton() {
    return currentPage().locator(".btn").first()
  }

  async getDownloadAttachmentButton() {
    return currentPage().locator("//a[text()='Download']").first()
  }

  async getNoContentButton() {
    return currentPage()
      .locator("//a[text()='Attachment has no content']")
      .first()
  }

  async getImage() {
    return currentPage().locator(".attachment-column").first()
  }

  async getFilename() {
    return currentPage().locator("#fileName").first()
  }

  async getCaption() {
    return currentPage().locator("#caption").first()
  }

  async getContentLength() {
    return currentPage().locator("#contentLength").first()
  }

  async getOwner() {
    return currentPage().locator("//a[text()='CIV Arthur Dmin']").first()
  }

  async getDescription() {
    return currentPage().locator("#description").first()
  }

  async getEditDescription() {
    return currentPage()
      .locator(".description > div:last-child > div > p > span > span > span")
      .first()
  }

  async getMimetype() {
    return currentPage().locator("#mimeType").first()
  }

  async getClassification() {
    return currentPage().locator("#classification").first()
  }

  async getUsedin() {
    return currentPage()
      .locator("//a[text()='A test report from Arthur']")
      .first()
  }

  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openEdit(uuid) {
    await super.open(EDIT_URL.replace(":uuid", uuid))
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }
}

export default new ShowAttachment()
