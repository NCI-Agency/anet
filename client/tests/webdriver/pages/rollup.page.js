import Page from "./page"

const PAGE_URL = "/rollup"

class Rollup extends Page {
  async getRollup() {
    return browser.$("div#daily-rollup")
  }

  async getEmailButton() {
    return browser.$("button#email-rollup")
  }

  async getEmailPreviewButton() {
    return browser.$("a#preview-rollup-email")
  }

  async open() {
    await super.open(PAGE_URL)
  }
}

export default new Rollup()
