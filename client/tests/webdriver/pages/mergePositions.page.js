import Page from "./page"

const PATH = "/admin/mergePositions"

class MergePositions extends Page {
  open() {
    super.openAsAdminUser(PATH)
  }

  get title() {
    return browser.$('//h2[contains(text(),"Merge Positions")]')
  }

  get leftPositionField() {
    return browser.$("#Position1")
  }

  get rightPositionField() {
    return browser.$("#Position2")
  }

  get advancedSelectPopover() {
    return browser.$(".bp3-popover2-content")
  }

  get positionHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Position")]')
  }

  get firstItemFromAdvancedSelect() {
    return browser.$("table > tbody > tr:first-child > td:nth-child(2) > span")
  }

  get mergePositionsButton() {
    return browser.$('//button//span[text()="Merge Positions"]')
  }

  getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-pos-col ${button} > button`)
  }

  getColumnPositionName(side) {
    return browser.$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="Name"]/following-sibling::div`
    )
  }

  waitForAdvancedSelectLoading(compareStr) {
    this.advancedSelectPopover.waitForExist()
    this.advancedSelectPopover.waitForDisplayed()
    this.positionHeaderFromPopover.waitForExist()
    this.positionHeaderFromPopover.waitForDisplayed()

    browser.waitUntil(
      () => {
        return this.firstItemFromAdvancedSelect.getText() === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched position in time"
      }
    )
  }

  waitForColumnToChange(compareStr, side) {
    const field = this.getColumnPositionName(side)

    browser.waitUntil(
      () => {
        return field.getText() === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't set the position in time"
      }
    )
  }

  waitForSuccessAlert() {
    browser.waitUntil(
      () => {
        return (
          browser.$(".alert-success").getText() ===
          "Positions merged. Displaying merged Position below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
  }
}

export default new MergePositions()
