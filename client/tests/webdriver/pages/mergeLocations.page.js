import Page from "./page"

const PATH = "/admin/merge/locations"

class MergeLocations extends Page {
  open() {
    super.openAsAdminUser(PATH)
  }

  get title() {
    return browser.$('//h4[contains(text(),"Merge Locations")]')
  }

  get leftLocationField() {
    return browser.$("#Location1")
  }

  get rightLocationField() {
    return browser.$("#Location2")
  }

  get advancedSelectPopover() {
    return browser.$(".bp3-popover2-content")
  }

  get locationHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Name")]')
  }

  get firstItemFromAdvancedSelect() {
    return browser.$(
      ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
    )
  }

  get mergeLocationsButton() {
    return browser.$('//button[text()="Merge Locations"]')
  }

  getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-loc-col ${button} > button`)
  }

  getColumnLocationName(side) {
    return browser.$(
      `//div[@id="${side}-merge-loc-col"]//div[text()="Name"]/following-sibling::div`
    )
  }

  waitForAdvancedSelectLoading(compareStr) {
    this.advancedSelectPopover.waitForExist()
    this.advancedSelectPopover.waitForDisplayed()
    this.locationHeaderFromPopover.waitForExist()
    this.locationHeaderFromPopover.waitForDisplayed()

    browser.waitUntil(
      () => this.firstItemFromAdvancedSelect.getText() === compareStr,
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched location in time"
      }
    )
  }

  waitForColumnToChange(compareStr, side) {
    const field = this.getColumnLocationName(side)

    browser.waitUntil(
      () => {
        return field.getText() === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't set the location in time"
      }
    )
  }

  waitForSuccessAlert() {
    browser.waitUntil(
      () => {
        return (
          browser.$(".alert-success").getText() ===
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
