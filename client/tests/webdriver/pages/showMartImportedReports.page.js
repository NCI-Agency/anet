import Page from "./page"

const PAGE_URL = "/admin/martImporter"

class ShowMartImportedReports extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getTable() {
    return browser.$("table")
  }

  async getExportDictinaryButton() {
    return browser.$("button")
  }

  async getTableRows() {
    return (await this.getTable()).$$("tbody tr")
  }
}
export default new ShowMartImportedReports()
