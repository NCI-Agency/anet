import Page from "./page"

const PATH = "/admin/mergePeople"

class MergePeople extends Page {
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
    return browser.$('//h4[contains(text(),"Merge People")]')
  }

  get leftPersonField() {
    return browser.$("#Person1")
  }

  get rightPersonField() {
    return browser.$("#Person2")
  }

  get advancedSelectPopover() {
    return browser.$(".bp3-popover2-content")
  }

  get personHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "name")]')
  }

  get firstItemFromAdvancedSelect() {
    return browser.$("table > tbody > tr:first-child > td:nth-child(2) > span")
  }

  get samePositionsToast() {
    return browser.$('//div[text()="Please select different people"]')
  }

  get mergePeopleButton() {
    return browser.$('//button[text()="Merge People"]')
  }

  get showNotesButton() {
    return browser.$('button[title="Show notes"]')
  }

  get unoccupiedPositionPersonMessage() {
    return browser.$("p.position-empty-message")
  }

  get noteCards() {
    return browser.$$(".offcanvas .card")
  }

  getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-per-col ${button} > button`)
  }

  getSelectButton(side, text) {
    const buttonDiv = browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]`
    )
    const button = buttonDiv.$("..").$("..")
    return button.$("small > button")
  }

  getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  getPreviousPositions(side) {
    const previousPositionsElements = browser.$$(
      `//div[@id="${side}-merge-per-col"]//div[text()="Previous Positions"]/following-sibling::div//table//tbody//tr`
    )
    const previousPositions = previousPositionsElements.map(elem => {
      return {
        name: elem.$$("td")[0].getText(),
        date: elem.$$("td")[1].getText()
      }
    })
    return previousPositions
  }

  waitForAdvancedSelectLoading(compareStr) {
    this.advancedSelectPopover.waitForExist()
    this.advancedSelectPopover.waitForDisplayed()
    this.personHeaderFromPopover.waitForExist()
    this.personHeaderFromPopover.waitForDisplayed()

    browser.waitUntil(
      () => {
        return this.firstItemFromAdvancedSelect.getText() === compareStr
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched person in time"
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
        timeoutMsg: "Couldn't set the person in time"
      }
    )
  }

  waitForSuccessAlert() {
    browser.waitUntil(
      () => {
        return (
          browser.$(".alert-success").getText() ===
          "People merged. Displaying merged Person below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
  }

  areNotesExist(notes) {
    let areExist = true
    const allNoteTexts = this.noteCards.map(card =>
      card.$$(".card-body > div")[1].getText()
    )
    notes.forEach(note => {
      if (!allNoteTexts.includes(note)) {
        areExist = false
      }
    })
    return areExist
  }
}

export default new MergePeople()
