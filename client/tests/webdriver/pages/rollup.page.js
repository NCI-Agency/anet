import Page from "./page"

const PAGE_URL = "/rollup"

class Rollup extends Page {
  get rollup() {
    return browser.$("div#daily-rollup")
  }

  get emailButton() {
    return browser.$("button#email-rollup")
  }

  get emailPreviewButton() {
    return browser.$("a#preview-rollup-email")
  }

  open() {
    super.open(PAGE_URL)
  }
}

export default new Rollup()
