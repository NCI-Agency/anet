import Page from "./page"

const PATH = "/admin/merge/people"

class MergePeople extends Page {
  open() {
    super.openAsAdminUser(PATH)
  }

  openPage(path) {
    super.openAsAdminUser(path)
  }

  getErrorTitle() {
    return browser.$("//h1")
  }

  getTitle() {
    return browser.$('//h4[contains(text(),"Merge People")]')
  }

  getLeftPersonField() {
    return browser.$("#Person1")
  }

  getRightPersonField() {
    return browser.$("#Person2")
  }

  getAdvancedSelectPopover() {
    return browser.$(".bp4-popover2-content")
  }

  getPersonHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "name")]')
  }

  getFirstItemFromAdvancedSelect() {
    return browser.$("table > tbody > tr:first-child > td:nth-child(2) > span")
  }

  getSamePositionsToast() {
    return browser.$('//div[text()="Please select different people"]')
  }

  getMergePeopleButton() {
    return browser.$('//button[text()="Merge People"]')
  }

  getShowNotesButton() {
    return browser.$('button[title="Show notes"]')
  }

  getUnoccupiedPositionPersonMessage() {
    return browser.$("p.position-empty-message")
  }

  getNoteCards() {
    return browser.$$(".offcanvas .card")
  }

  getClearValueButtons() {
    return browser.$$(
      "//div[@id=\"mid-merge-per-col\"]//button[contains(@class, 'remove-button')]"
    )
  }

  getEditHistoryButton() {
    return browser.$('//button[text()="Edit History Manually"]')
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
    this.getAdvancedSelectPopover().waitForExist()
    this.getAdvancedSelectPopover().waitForDisplayed()
    this.getPersonHeaderFromPopover().waitForExist()
    this.getPersonHeaderFromPopover().waitForDisplayed()

    browser.waitUntil(
      () => {
        return this.getFirstItemFromAdvancedSelect().getText() === compareStr
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
    const allNoteTexts = this.getNoteCards().map(card =>
      card.$(".card-body > div").getText()
    )
    notes.forEach(note => {
      if (!allNoteTexts.includes(note)) {
        areExist = false
      }
    })
    return areExist
  }

  waitForDifferentRolesAlert() {
    browser.waitUntil(
      () => {
        return (
          browser.$(".alert-warning").getText() ===
          "People on each side has different roles."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
  }
}

export default new MergePeople()
