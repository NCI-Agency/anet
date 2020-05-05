import Page from "../page"

const PAGE_URL = "/reports/:uuid/edit"

class EditReport extends Page {
  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get deleteButton() {
    return browser.$(
      "//div[@class='submit-buttons']//button[text()='Delete this report']"
    )
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  confirmDeleteButton(uuid) {
    return browser.$(
      `//div[@class="modal-footer"]//button[text()="Yes, I am sure that I want to delete report ${uuid}"]`
    )
  }

  deleteReport(uuid) {
    this.deleteButton.click()
    this.confirmDeleteButton(uuid).waitForExist()
    this.confirmDeleteButton(uuid).waitForDisplayed()
    this.confirmDeleteButton(uuid).waitForClickable()
    browser.pause(200) // wait for modal animation to finish
    this.confirmDeleteButton(uuid).click()
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
