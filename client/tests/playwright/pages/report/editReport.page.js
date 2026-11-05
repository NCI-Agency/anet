import Page from "../page.js"

const PAGE_URL = "/reports/:uuid/edit"
class EditReport extends Page {
  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async getDeleteButton(planned) {
    return this.page
      .locator(
        `//div[@class='submit-buttons']//button[text()='Delete this ${planned ? "planned engagement" : "report"}']`
      )
      .first()
  }

  async getUnpublishButton() {
    return this.page.locator('//button[text()="Unpublish report"]').first()
  }

  async getConfirmModal() {
    return this.page.locator("div.triggerable-confirm-bootstrap-modal").first()
  }

  async getReportText() {
    return this.page.locator(".reportTextField").first()
  }

  async confirmDeleteButton(uuid) {
    return this.page.locator('//button[text()="Yes, I am sure"]').first()
  }

  async confirmUnpublishButton(uuid) {
    return this.page.locator('//button[text()="Yes, I am sure"]').first()
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
      await (
        await this.getSubmitButton()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    }
  }
}
export default EditReport
