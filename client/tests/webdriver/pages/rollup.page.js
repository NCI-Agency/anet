import Page from "./page"

const PAGE_URL = "/rollup"

class Rollup extends Page {
  async getRollup() {
    return browser.$("div#daily-rollup")
  }

  async getEmailButton() {
    return browser.$("button#email-rollup")
  }

  async getEmailPreviewButton() {
    return browser.$("a#preview-rollup-email")
  }

  async getEmailRollupButton() {
    return browser.$("button#email-rollup")
  }

  async getEmailTo() {
    return browser.$("#to")
  }

  async getSendEmailButton() {
    return browser.$("button#send-rollup-email")
  }

  async getInvalidFeedbackLabel() {
    return browser.$(".invalid-feedback > div > p")
  }

  async getInvalidFeedbackLabelEmailList() {
    return browser.$$(".invalid-feedback > div > ul > li")
  }

  async getSuccessMessage() {
    return browser.$(".alert-success.show")
  }

  async open() {
    await super.open(PAGE_URL)
  }
}

export default new Rollup()
