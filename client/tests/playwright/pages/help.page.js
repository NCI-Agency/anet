import Page from "./page.js"

const PAGE_URL = "/help"

class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSuperuserLinks() {
    return this.page.locator(".superusers-list").getByRole("link")
  }

  async getAdministratorLinks() {
    return this.page.locator(".admins-list").getByRole("link")
  }

  async getHelpText() {
    await this.page.locator("fieldset").first().waitFor({
      state: "visible"
    })
    return this.page.locator("fieldset .editable").first()
  }
}

export default Help
