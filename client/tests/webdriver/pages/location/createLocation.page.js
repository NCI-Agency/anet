import Page from "../page"

const PAGE_URL = "/location/new"

class CreateLocation extends Page {
  get form() {
    return browser.$("form")
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }
}

export default new CreateLocation()
