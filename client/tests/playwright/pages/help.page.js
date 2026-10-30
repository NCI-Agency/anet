import Page from "./page.js"

const PAGE_URL = "/help"
class Help extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async getSuperusers() {
    const superusersDiv = await this.page.locator(".superusers-list").first()
    await superusersDiv.waitFor({
      state: "visible",
      timeout: 10000
    })
    const superusers = await superusersDiv.locator("span").all()
    return Promise.all(
      superusers.map(async user => (await user.innerText()).trim())
    )
  }

  async getAdministrators() {
    const adminsDiv = await this.page.locator(".admins-list").first()
    await adminsDiv.waitFor({
      state: "visible",
      timeout: 10000
    })
    const admins = await adminsDiv.locator("span").all()
    return Promise.all(
      admins.map(async user => (await user.innerText()).trim())
    )
  }

  async getHelpText() {
    await this.page.locator("fieldset").first().waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.page.locator("fieldset .editable").first()
  }
}
export default Help
