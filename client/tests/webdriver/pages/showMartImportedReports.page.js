import Page from "./page"

const PAGE_URL = "/admin/martImportedReports"

class ShowMartImportedReports extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getTable() {
    return browser.$("table")
  }

  async getTableRows() {
    return (await this.getTable()).$$("tbody tr")
  }
}
export default new ShowMartImportedReports()
