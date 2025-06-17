import Page from "./page"

const PAGE_URL = "/admin"

class Admin extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
    console.log(PAGE_URL)
  }

  async updateHelpText(helpText) {
    await this.fillRichTextInput(
      await browser.$("fieldset"),
      "div[id='fg-HELP_TEXT'] .editor-container > .editable",
      helpText,
      ""
    )

    await this.submitChanges()
  }

  async submitChanges() {
    const submitButton = await browser.$(".submit-buttons button")
    await submitButton.click()
  }
}

export default new Admin()
