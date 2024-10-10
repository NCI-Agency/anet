import Page from "../page"

const PAGE_URL = "/reports/:uuid/edit"

class EditReport extends Page {
  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getDeleteButton(planned) {
    return browser.$(
      `//div[@class='submit-buttons']//button[text()='Delete this ${planned ? "planned engagement" : "report"}']`
    )
  }

  async getUnpublishButton() {
    return browser.$('//button[text()="Unpublish report"]')
  }

  async getConfirmModal() {
    return browser.$("div.triggerable-confirm-bootstrap-modal")
  }

  async getReportText() {
    return browser.$(".reportTextField")
  }

  async confirmDeleteButton(uuid) {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async confirmUnpublishButton(uuid) {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async deleteReport(uuid, planned) {
    await (await this.getDeleteButton(planned)).click()
    await browser.pause(300) // wait for modal animation to finish
    await (await this.confirmDeleteButton(uuid)).waitForExist()
    await (await this.confirmDeleteButton(uuid)).waitForDisplayed()
    await (await this.confirmDeleteButton(uuid)).waitForClickable()
    await browser.pause(300) // wait for modal animation to finish
    await (await this.confirmDeleteButton(uuid)).click()
    await this.waitForAlertSuccessToLoad()
  }

  async unpublishReport(uuid) {
    await (await this.getUnpublishButton()).click()
    await browser.pause(300) // wait for modal animation to finish
    await (await this.confirmUnpublishButton(uuid)).waitForExist()
    await (await this.confirmUnpublishButton(uuid)).waitForDisplayed()
    await (await this.confirmUnpublishButton(uuid)).waitForClickable()
    await browser.pause(300) // wait for modal animation to finish
    await (await this.confirmUnpublishButton(uuid)).click()
    await this.waitForAlertSuccessToLoad()
  }

  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
    await this.waitForEditReportToLoad()
  }

  async waitForEditReportToLoad() {
    if (!(await (await this.getSubmitButton()).isDisplayed())) {
      await (await this.getSubmitButton()).waitForExist()
      await (await this.getSubmitButton()).waitForDisplayed()
    }
  }
}

export default new EditReport()
