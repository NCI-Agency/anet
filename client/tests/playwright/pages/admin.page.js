import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/admin"
class Admin extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async updateHelpText(helpText) {
    await this.fillRichTextInput(
      await currentPage().locator("fieldset").first(),
      "div[id='fg-HELP_TEXT'] .editor-container > .editable",
      helpText,
      ""
    )
    await this.submitChanges()
  }

  async submitChanges() {
    const submitButton = await currentPage()
      .locator(".submit-buttons button")
      .first()
    await submitButton.click()
  }
}
export default new Admin()
