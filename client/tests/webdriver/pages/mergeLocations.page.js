import Page from "./page"

const PATH = "/admin/merge/locations"

class MergeLocations extends Page {
  async open() {
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
    return browser.$(".bp5-popover-content")
  }

  async getLocationHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Name")]')
  }

  async getFirstItemFromAdvancedSelect() {
    return browser.$(
      ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
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
    const button = await (await buttonDiv.$("..")).$("..")
    return button.$("small > button")
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getLocationHeaderFromPopover()).waitForExist()
    await (await this.getLocationHeaderFromPopover()).waitForDisplayed()

    await browser.waitUntil(
      async() =>
        (await (await this.getFirstItemFromAdvancedSelect()).getText()) ===
        compareStr,
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched location in time"
      }
    )
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-loc-col"]//div[text()="${text}"]/following-sibling::div`
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
        timeoutMsg: "Couldn't set the location in time"
      }
    )
  }

  async waitForSuccessAlert() {
    await browser.waitUntil(
      async() => {
        return (
          (await (await browser.$(".alert-success")).getText()) ===
          "Locations merged. Displaying merged Location below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
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
