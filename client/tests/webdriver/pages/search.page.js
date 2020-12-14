import Page from "./page"

class Search extends Page {
  get foundPeopleTable() {
    return browser.$("div#people")
  }

  get linkOfFirstPersonFound() {
    return this.foundPeopleTable.$("table tbody tr:first-child a")
  }
}

export default new Search()
