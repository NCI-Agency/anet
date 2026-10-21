import { currentPage, waitFor } from "../../support.js"
import Page from "../page.js"

const PAGE_URL = "/reports/:uuid/edit"

class EditReport extends Page {
  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async getDeleteButton(planned) {
    return currentPage()
      .locator(
        `//div[@class='submit-buttons']//button[text()='Delete this ${planned ? "planned engagement" : "report"}']`
      )
      .first()
  }

  async getUnpublishButton() {
    return currentPage().locator('//button[text()="Unpublish report"]').first()
  }

  async getConfirmModal() {
    return currentPage()
      .locator("div.triggerable-confirm-bootstrap-modal")
      .first()
  }

  async getReportText() {
    return currentPage().locator(".reportTextField").first()
  }

  async confirmDeleteButton(uuid) {
    return currentPage().locator('//button[text()="Yes, I am sure"]').first()
  }

  async confirmUnpublishButton(uuid) {
    return currentPage().locator('//button[text()="Yes, I am sure"]').first()
  }

  async deleteReport(uuid, planned) {
    await (await this.getDeleteButton(planned)).click()
    // wait for modal animation to finish
    // wait for modal animation to finish
    await (await this.confirmDeleteButton(uuid)).click()
    await this.waitForAlertSuccessToLoad()
  }

  async unpublishReport(uuid) {
    await (await this.getUnpublishButton()).click()
    // wait for modal animation to finish
    // wait for modal animation to finish
    await (await this.confirmUnpublishButton(uuid)).click()
    await this.waitForAlertSuccessToLoad()
  }

  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
    await this.waitForEditReportToLoad()
  }

  async waitForEditReportToLoad() {
    if (!(await (await this.getSubmitButton()).isVisible())) {
      await waitFor(await this.getSubmitButton(), "visible")
    }
  }
}

export default new EditReport()
