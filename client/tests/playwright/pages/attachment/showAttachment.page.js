import Page from "../page.js"

const PAGE_URL = "/attachments/:uuid"
const EDIT_URL = "/attachments/:uuid/edit"

class ShowAttachment extends Page {
  async getEditAttachmentButton() {
    return this.page.locator(".btn").first()
  }

  async getDownloadAttachmentButton() {
    return this.page
      .getByRole("link", { name: "Download", exact: true })
      .first()
  }

  async getNoContentButton() {
    return this.page
      .getByRole("link", { name: "Attachment has no content", exact: true })
      .first()
  }

  async getImage() {
    return this.page.locator(".attachment-column").first()
  }

  async getFilename() {
    return this.page.locator("#fileName").first()
  }

  async getCaption() {
    return this.page.locator("#caption").first()
  }

  async getContentLength() {
    return this.page.locator("#contentLength").first()
  }

  async getOwner() {
    return this.page
      .getByRole("link")
      .and(this.page.getByText("CIV Arthur Dmin", { exact: true }))
      .first()
  }

  async getDescription() {
    return this.page.locator("#description").first()
  }

  async getEditDescription() {
    return this.page
      .locator(".description > div:last-child > div > p > span > span > span")
      .first()
  }

  async getMimetype() {
    return this.page.locator("#mimeType").first()
  }

  async getClassification() {
    return this.page.locator("#classification").first()
  }

  async getUsedin() {
    return this.page
      .getByRole("link")
      .and(this.page.getByText("A test report from Arthur", { exact: true }))
      .first()
  }

  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openEdit(uuid) {
    await super.open(EDIT_URL.replace(":uuid", uuid))
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }
}

export default ShowAttachment
