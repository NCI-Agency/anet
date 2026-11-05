import Page from "./page.js"

const PAGE_URL = "/admin/martImporter"
class ShowMartImportedReports extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getTable() {
    return this.page.locator("table").first()
  }

  async getExportDictionaryButton() {
    return this.page.locator("button").first()
  }

  async getTableRows() {
    return (await this.getTable()).locator("tbody tr")
  }
}
export default ShowMartImportedReports
