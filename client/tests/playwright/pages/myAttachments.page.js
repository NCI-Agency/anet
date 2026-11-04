import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/attachments/mine"

class MyAttachments extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getMyAttachments() {
    return currentPage().locator("#my-attachments").first()
  }

  async getAttachmentRows() {
    return (await this.getMyAttachments()).locator(
      "table.attachments_table > tbody > tr"
    )
  }

  async getAttachmentClassifications() {
    return (await this.getAttachmentRows()).locator(
      "td:nth-child(2) .attachment-classification"
    )
  }
}

export default new MyAttachments()
