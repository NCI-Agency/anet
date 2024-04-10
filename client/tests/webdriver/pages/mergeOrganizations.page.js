import Page from "./page"

const PATH = "/admin/merge/organizations"

class MergeOrganizations extends Page {
  async open() {
    await super.openAsAdminUser(PATH)
  }

  async openPage(path) {
    await super.openAsAdminUser(path)
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Organizations")]')
  }
}

export default new MergeOrganizations()
