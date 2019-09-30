import Page from "./page"

const PAGE_URL = "/rollup"

class Rollup extends Page {
  get rollup() {
    return browser.$("div#daily-rollup")
  }

  get printButton() {
    return browser.$("a.btn.btn-default")
  }

  open() {
    super.open(PAGE_URL)
  }
}

export default new Rollup()
