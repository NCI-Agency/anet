import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/admin/martImporter"

class ShowMartImportedReports extends Page {
  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async getTable() {
    return currentPage().locator("table").first()
  }

  async getExportDictionaryButton() {
    return currentPage().locator("button").first()
  }

  async getTableRows() {
    return (await this.getTable()).locator("tbody tr").all()
  }
}

export default new ShowMartImportedReports()
