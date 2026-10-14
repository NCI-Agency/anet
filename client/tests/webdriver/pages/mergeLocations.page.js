import Page from "./page"

const PATH = "/admin/merge/locations"

class MergeLocations extends Page {
  async openPage() {
    await super.openAsAdminUser(PATH)
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Locations")]')
  }

  async getLeftLocationField() {
    return browser.$("#Location1")
  }

  async getRightLocationField() {
    return browser.$("#Location2")
  }

  async getAdvancedSelectPopover() {
    return browser.$(".bp6-popover-content")
  }

  async getLocationHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Name")]')
  }

  async getFirstItemFromAdvancedSelect() {
    return browser.$(
      ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) span"
    )
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return browser.$(
      "table > tbody > tr:first-child > td:first-child > input.form-check-input"
    )
  }

  async getMergeLocationsButton() {
    return browser.$('//button[text()="Merge Locations"]')
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-loc-col ${button} > button`)
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-loc-col"]//div[text()="${text}"]`
    )
    const button = await buttonDiv.parentElement().parentElement()
    return button.$("small > button")
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getLocationHeaderFromPopover()).waitForExist()
    await (await this.getLocationHeaderFromPopover()).waitForDisplayed()
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect,
      compareStr
    )
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-loc-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async waitForColumnToChange(compareStr, side, text) {
    return this.waitForElementToChange(
      async () => this.getColumnContent(side, text),
      compareStr
    )
  }

  async waitForColumnToStartWith(compareStr, side, text) {
    const field = await this.getColumnContent(side, text)

    await browser.waitUntil(
      async () => {
        const fieldText = await field.getText()
        return fieldText?.startsWith(compareStr)
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't set the location in time"
      }
    )
  }

  async waitForSuccessAlert() {
    return this.waitForElementToChange(
      this.getAlertSuccess,
      "Locations merged. Displaying merged Location below."
    )
  }

  async getField(fieldName) {
    return browser.$(`div[id="${fieldName}"]`)
  }

  async getFieldset(fieldName) {
    return (await this.getField(fieldName)).$("fieldset")
  }
}

export default new MergeLocations()
