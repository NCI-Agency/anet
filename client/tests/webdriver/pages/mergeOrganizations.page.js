import Page from "./page"

const PATH = "/admin/merge/organizations"

class MergeOrganizations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Organizations")]')
  }

  async getLeftOrganizationField() {
    return browser.$("#Organization1")
  }

  async getRightOrganizationField() {
    return browser.$("#Organization2")
  }

  async getFirstItemFromAdvancedSelect() {
    return browser.$(
      ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
    )
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return browser.$(
      "table > tbody > tr:first-child > td:first-child > input.form-check-input"
    )
  }

  async getAdvancedSelectPopover() {
    return browser.$(".bp5-popover-content")
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-org-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getMergeOrganizationsButton() {
    return browser.$('//button[text()="Merge Organizations"]')
  }

  async getOrganizationHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Organization")]')
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-org-col"]//div[text()="${text}"]`
    )
    const button = await (await buttonDiv.$("..")).$("..")
    return button.$("small > button")
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-org-col ${button} > button`)
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getOrganizationHeaderFromPopover()).waitForExist()
    await (await this.getOrganizationHeaderFromPopover()).waitForDisplayed()

    await browser.waitUntil(
      async() => {
        return (
          (await (await this.getFirstItemFromAdvancedSelect()).getText()) ===
          compareStr
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched organization in time"
      }
    )
  }

  async waitForColumnToChange(compareStr, side, text) {
    const field = await this.getColumnContent(side, text)

    await browser.waitUntil(
      async() => {
        return (await field.getText()) === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't set the organization in time"
      }
    )
  }

  async waitForSuccessAlert() {
    await browser.waitUntil(
      async() => {
        return (
          (await (await browser.$(".alert-success")).getText()) ===
          "Organizations merged. Displaying merged Organization below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
  }
}

export default new MergeOrganizations()
