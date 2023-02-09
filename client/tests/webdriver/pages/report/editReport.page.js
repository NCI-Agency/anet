import Page from "../page"

const PAGE_URL = "/reports/:uuid/edit"

class EditReport extends Page {
  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  getDeleteButton() {
    return browser.$(
      "//div[@class='submit-buttons']//button[text()='Delete this planned engagement']"
    )
  }

  getUnpublishButton() {
    return browser.$('//button[text()="Unpublish report"]')
  }

  getConfirmModal() {
    return browser.$("div.triggerable-confirm-bootstrap-modal")
  }

  getReportText() {
    return browser.$(".reportTextField")
  }

  confirmDeleteButton(uuid) {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  confirmUnpublishButton(uuid) {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  deleteReport(uuid) {
    this.getDeleteButton().click()
    browser.pause(300) // wait for modal animation to finish
    this.confirmDeleteButton(uuid).waitForExist()
    this.confirmDeleteButton(uuid).waitForDisplayed()
    this.confirmDeleteButton(uuid).waitForClickable()
    browser.pause(300) // wait for modal animation to finish
    this.confirmDeleteButton(uuid).click()
    this.waitForAlertSuccessToLoad()
  }

  unpublishReport(uuid) {
    this.getUnpublishButton().click()
    browser.pause(300) // wait for modal animation to finish
    this.confirmUnpublishButton(uuid).waitForExist()
    this.confirmUnpublishButton(uuid).waitForDisplayed()
    this.confirmUnpublishButton(uuid).waitForClickable()
    browser.pause(300) // wait for modal animation to finish
    this.confirmUnpublishButton(uuid).click()
    this.waitForAlertSuccessToLoad()
  }

  open(uuid) {
    super.open(PAGE_URL.replace(":uuid", uuid))
    this.waitForEditReportToLoad()
  }

  waitForEditReportToLoad() {
    if (!this.getSubmitButton().isDisplayed()) {
      this.getSubmitButton().waitForExist()
      this.getSubmitButton().waitForDisplayed()
    }
  }
}

export default new EditReport()
