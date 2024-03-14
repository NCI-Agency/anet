import Page from "./page"

const PAGE_URL = "/attachments/mine"

class MyAttachments extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getMyAttachments() {
    return browser.$("#my-attachments")
  }
}

export default new MyAttachments()
