import Page from "./page"

class Search extends Page {
  get foundPeopleTable() {
    return browser.$("div#people #people-search-results")
  }

  get foundTaskTable() {
    return browser.$("div#tasks #tasks-search-results")
  }

  linkOfPersonFound(name) {
    return this.foundPeopleTable.$(`//tbody/tr//a[contains(text(), "${name}")]`)
  }

  linkOfTaskFound(name) {
    return this.foundTaskTable.$(`//tbody/tr//a[contains(text(), "${name}")]`)
  }
}

export default new Search()
