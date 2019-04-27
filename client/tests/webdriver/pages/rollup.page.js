import Page from "./page"

const PAGE_URL = "/rollup"

class Rollup extends Page {
  get printButton() {
    return browser.$("a.btn.btn-default")
  }

  open() {
    super.open(PAGE_URL)
  }
}

export default new Rollup()
