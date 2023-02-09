import Page from "./page"

const PAGE_URL = "/rollup"

class Rollup extends Page {
  getRollup() {
    return browser.$("div#daily-rollup")
  }

  getEmailButton() {
    return browser.$("button#email-rollup")
  }

  getEmailPreviewButton() {
    return browser.$("a#preview-rollup-email")
  }

  open() {
    super.open(PAGE_URL)
  }
}

export default new Rollup()
