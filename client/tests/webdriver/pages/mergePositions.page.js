import Page from "./page"

const PATH = "/admin/mergePositions"

class MergePositions extends Page {
  open() {
    super.openAsAdminUser(PATH)
  }

  openPage(path) {
    super.openAsAdminUser(path)
  }

  get errorTitle() {
    return browser.$("//h1")
  }

  get title() {
    return browser.$('//h4[contains(text(),"Merge Positions")]')
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

  get editAssociatedPositionsButton() {
    return browser.$('//button[text()="Edit Associated Positions"]')
  }

  get editAssociatedPositionsModal() {
    return browser.$(
      "//div[contains(@class, 'edit-associated-positions-dialog')]"
    )
  }

  get saveAssociatedPositionsButton() {
    return this.editAssociatedPositionsModal.$('//button[text()="Save"]')
  }

  get mergePositionsButton() {
    return browser.$('//button[text()="Merge Positions"]')
  }

  get samePositionsToast() {
    return browser.$('//div[text()="Please select different positions"]')
  }

  get occupiedPositionsToast() {
    return browser.$(
      '//div[text()="Please select at least one unoccupied position"]'
    )
  }

  get winnerAssociatedPositions() {
    const associatedPositionRows = browser.$$("#assigned-principal tbody tr")
    const winnerAps = associatedPositionRows.map(elem => {
      return {
        person: elem.$$("td")[0].getText(),
        position: elem.$$("td")[1].getText()
      }
    })
    return winnerAps
  }

  getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-pos-col ${button} > button`)
  }

  getSelectButton(side, text) {
    const buttonDiv = browser.$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="${text}"]`
    )
    const button = buttonDiv.$("..").$("..")
    return button.$("small > button")
  }

  getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  getAssociatedPositions(side) {
    const associatedPositionElements = browser.$$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="Associated Positions"]//following-sibling::div//table//tbody//tr`
    )
    const associatedPositions = associatedPositionElements.map(elem => {
      return {
        person: elem.$$("td")[0].getText(),
        position: elem.$$("td")[1].getText()
      }
    })
    return associatedPositions
  }

  getPreviousPeople(side) {
    const previousPeopleElements = browser.$$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="Previous People"]/following-sibling::div//table//tbody//tr`
    )
    const previousPeople = previousPeopleElements.map(elem => {
      return {
        name: elem.$$("td")[0].getText(),
        date: elem.$$("td")[1].getText()
      }
    })
    return previousPeople
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

  waitForColumnToChange(compareStr, side, text) {
    const field = this.getColumnContent(side, text)

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

  getAssociatedPositionsInModal(side) {
    const selectedSide = browser.$$(`#edit-ap-${side} tbody tr`)
    const associatedPositions = selectedSide.map(elem => {
      return {
        // On the right column first td is button while on the other columns last td is the button
        person: elem.$$("td")[side === "right" ? 1 : 0].getText(),
        position: elem.$$("td")[side === "right" ? 2 : 1].getText()
      }
    })
    return associatedPositions
  }

  getAssociatedPositionActionButton(side, index) {
    const selectedRow = browser.$$(`#edit-ap-${side} tbody tr`)[index]
    return selectedRow.$$("td")[side === "right" ? 0 : 2].$("button")
  }
}

export default new MergePositions()
