import Page from "../page"

const PAGE_URL = "/reports/:uuid/edit"

class EditReport extends Page {
  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get deleteButton() {
    return browser.$(
      "//div[@class='submit-buttons']//button[text()='Delete this planned engagement']"
    )
  }

  get unpublishButton() {
    return browser.$('//button[text()="Unpublish report"]')
  }

  get confirmModal() {
    return browser.$("div.triggerable-confirm-bootstrap-modal")
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  confirmDeleteButton(uuid) {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  confirmUnpublishButton(uuid) {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  deleteReport(uuid) {
    this.deleteButton.click()
    browser.pause(300) // wait for modal animation to finish
    this.confirmDeleteButton(uuid).waitForExist()
    this.confirmDeleteButton(uuid).waitForDisplayed()
    this.confirmDeleteButton(uuid).waitForClickable()
    browser.pause(300) // wait for modal animation to finish
    this.confirmDeleteButton(uuid).click()
    this.waitForAlertSuccessToLoad()
  }

  unpublishReport(uuid) {
    this.unpublishButton.click()
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
    if (!this.submitButton.isDisplayed()) {
      this.submitButton.waitForExist()
      this.submitButton.waitForDisplayed()
    }
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }
}

export default new EditReport()
