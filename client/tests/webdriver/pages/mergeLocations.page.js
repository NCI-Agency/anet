import Page from "./page"

const PATH = "/admin/merge/locations"

class MergeLocations extends Page {
  open() {
    super.openAsAdminUser(PATH)
  }

  getTitle() {
    return browser.$('//h4[contains(text(),"Merge Locations")]')
  }

  getLeftLocationField() {
    return browser.$("#Location1")
  }

  getRightLocationField() {
    return browser.$("#Location2")
  }

  getAdvancedSelectPopover() {
    return browser.$(".bp4-popover2-content")
  }

  getLocationHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Name")]')
  }

  getFirstItemFromAdvancedSelect() {
    return browser.$(
      ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
    )
  }

  getMergeLocationsButton() {
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
    this.getAdvancedSelectPopover().waitForExist()
    this.getAdvancedSelectPopover().waitForDisplayed()
    this.getLocationHeaderFromPopover().waitForExist()
    this.getLocationHeaderFromPopover().waitForDisplayed()

    browser.waitUntil(
      () => this.getFirstItemFromAdvancedSelect().getText() === compareStr,
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
