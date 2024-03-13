import Page from "./page"

const PAGE_URL = "/attachments/mine"

class MyAttachments extends Page {
  async open(credentials) {
    await super.open(PAGE_URL, credentials)
  }

  async getMyAttachments() {
    return browser.$("#my-attachments")
  }
}

export default new MyAttachments()
