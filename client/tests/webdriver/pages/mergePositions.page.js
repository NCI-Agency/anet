import Page from "./page"

const PATH = "/admin/merge/positions"

class MergePositions extends Page {
  async openPage(path = PATH) {
    await super.openAsAdminUser(path)
  }

  async getErrorTitle() {
    return browser.$("//h1")
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge Positions")]')
  }

  async getLeftPositionField() {
    return browser.$("#Position1")
  }

  async getRightPositionField() {
    return browser.$("#Position2")
  }

  async getAdvancedSelectPopover() {
    return browser.$(".bp6-popover-content")
  }

  async getPositionHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Position")]')
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

  async getEditAssociatedPositionsButton() {
    return browser.$('//button[text()="Edit Associated Positions"]')
  }

  async getEditAssociatedPositionsModal() {
    return browser.$(
      "//div[contains(@class, 'edit-associated-positions-dialog')]"
    )
  }

  async getSaveAssociatedPositionsButton() {
    return (await this.getEditAssociatedPositionsModal()).$(
      './/button[text()="Save"]'
    )
  }

  async getMergePositionsButton() {
    return browser.$('//button[text()="Merge Positions"]')
  }

  async getOccupiedPositionsToast() {
    return browser.$(
      '//div[text()="Please select at least one unoccupied position"]'
    )
  }

  async getWinnerAssociatedPositions() {
    const associatedPositionRows = await browser.$$(
      "#assigned-counterpart tbody tr"
    )
    return await associatedPositionRows.map(async elem => {
      return {
        person: await (await elem.$$("td"))[0].getText(),
        position: await (await elem.$$("td"))[1].getText()
      }
    })
  }

  async getShowNotesButton() {
    return browser.$('button[title="Show notes"]')
  }

  async getNoteCards() {
    return browser.$$(".offcanvas .card")
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-pos-col ${button} > button`)
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="${text}"]`
    )
    const button = await (await buttonDiv.$("..")).$("..")
    return button.$("small > button")
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getAssociatedPositions(side) {
    const associatedPositionElements = await browser.$$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="Associated Positions"]//following-sibling::div//table//tbody//tr`
    )
    return await associatedPositionElements.map(async elem => {
      return {
        person: await (await elem.$$("td"))[0].getText(),
        position: await (await elem.$$("td"))[1].getText()
      }
    })
  }

  async getPreviousPeople(side) {
    const previousPeopleElements = await browser.$$(
      `//div[@id="${side}-merge-pos-col"]//div[text()="Previous People"]/following-sibling::div//table//tbody//tr`
    )
    return await previousPeopleElements.map(async elem => {
      return {
        name: await (await elem.$$("td"))[0].getText(),
        date: await (await elem.$$("td"))[1].getText()
      }
    })
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getPositionHeaderFromPopover()).waitForExist()
    await (await this.getPositionHeaderFromPopover()).waitForDisplayed()

    await browser.waitUntil(
      async () => {
        return (
          (await (await this.getFirstItemFromAdvancedSelect()).getText()) ===
          compareStr
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched position in time"
      }
    )
  }

  async waitForColumnToChange(compareStr, side, text) {
    const field = await this.getColumnContent(side, text)

    await browser.waitUntil(
      async () => {
        return (await field.getText()) === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't set the position in time"
      }
    )
  }

  async waitForSuccessAlert() {
    await browser.waitUntil(
      async () => {
        return (
          (await (await browser.$(".alert-success")).getText()) ===
          "Positions merged. Displaying merged Position below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
  }

  async getAssociatedPositionsInModal(side) {
    const selectedSide = await browser.$$(`#edit-ap-${side} tbody tr`)
    return await selectedSide.map(async elem => {
      return {
        // On the right column first td is button while on the other columns last td is the button
        person: await (await elem.$$("td"))[side === "right" ? 1 : 0].getText(),
        position: await (
          await elem.$$("td")
        )[side === "right" ? 2 : 1].getText()
      }
    })
  }

  async getAssociatedPositionActionButton(side, index) {
    const selectedRow = (await browser.$$(`#edit-ap-${side} tbody tr`))[index]
    return (await selectedRow.$$("td"))[side === "right" ? 0 : 2].$("button")
  }

  async areNotesExist(notes) {
    let areExist = true
    const noteCards = await this.getNoteCards()
    const allNoteTexts = await noteCards.map(
      async card => await (await card.$(".card-body > div")).getText()
    )
    for (const note of notes) {
      if (!allNoteTexts.includes(note)) {
        areExist = false
      }
    }
    return areExist
  }
}

export default new MergePositions()
