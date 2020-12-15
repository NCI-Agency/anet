import Page from "./page"

class Search extends Page {
  get foundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  get foundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
  }

  get linkOfFirstPersonFound() {
    return this.foundPeopleTable.$("tbody tr:first-child a")
  }

  get linkOfFirstTaskFound() {
    return this.foundTaskTable.$("tbody tr:first-child a")
  }
}

export default new Search()
