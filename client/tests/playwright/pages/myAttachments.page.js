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
    return (await this.getMyAttachments())
      .locator("table.attachments_table > tbody > tr")
      .all()
  }

  async getAttachmentCaptionCell(attachment) {
    return attachment.locator("td:nth-child(2)").first()
  }

  async getAttachmentClassification(attachmentCaptionCell) {
    return attachmentCaptionCell.locator(".attachment-classification").first()
  }
}

export default new MyAttachments()
