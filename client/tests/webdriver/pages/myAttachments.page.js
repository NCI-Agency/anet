import Page from "./page"

const PAGE_URL = "/attachments/mine"

class MyAttachments extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getMyAttachments() {
    return browser.$("#my-attachments")
  }

  async getAttachmentRows() {
    return (await this.getMyAttachments()).$$(
      "table.attachments_table > tbody > tr"
    )
  }

  async getAttachmentCaptionCell(attachment) {
    return attachment.$("td:nth-child(2)")
  }

  async getAttachmentClassification(attachmentCaptionCell) {
    return attachmentCaptionCell.$(".attachment-classification")
  }
}

export default new MyAttachments()
