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

  async getColumnLocationName(side) {
    return browser.$(
      `//div[@id="${side}-merge-loc-col"]//div[text()="Name"]/following-sibling::div`
    )
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

  async waitForColumnToChange(compareStr, side) {
    const field = await this.getColumnLocationName(side)

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
}

export default new MergeLocations()
