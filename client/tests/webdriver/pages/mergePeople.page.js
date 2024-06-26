import Page from "./page"

const PATH = "/admin/merge/people"

class MergePeople extends Page {
  async openPage(path = PATH) {
    await super.openAsAdminUser(path)
  }

  async getErrorTitle() {
    return browser.$("//h1")
  }

  async getTitle() {
    return browser.$('//h4[contains(text(),"Merge People")]')
  }

  async getLeftPersonField() {
    return browser.$("#Person1")
  }

  async getRightPersonField() {
    return browser.$("#Person2")
  }

  async getAdvancedSelectPopover() {
    return browser.$(".bp5-popover-content")
  }

  async getPersonHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "name")]')
  }

  async getFirstItemFromAdvancedSelect() {
    return browser.$("table > tbody > tr:first-child > td:nth-child(2) > span")
  }

  async getSamePositionsToast() {
    return browser.$('//div[text()="Please select different people"]')
  }

  async getMergePeopleButton() {
    return browser.$('//button[text()="Merge People"]')
  }

  async getShowNotesButton() {
    return browser.$('button[title="Show notes"]')
  }

  async getUnoccupiedPositionPersonMessage() {
    return browser.$("p.position-empty-message")
  }

  async getNoteCards() {
    return browser.$$(".offcanvas .card")
  }

  async getEditHistoryButton() {
    return browser.$('//button[text()="Edit History Manually"]')
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-per-col ${button} > button`)
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]`
    )
    const button = await (await buttonDiv.$("..")).$("..")
    return button.$("small > button")
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getPreviousPositions(side) {
    const previousPositionsElements = await browser.$$(
      `//div[@id="${side}-merge-per-col"]//div[text()="Previous Positions"]/following-sibling::div//table//tbody//tr`
    )
    return await previousPositionsElements.map(async elem => {
      return {
        name: await (await elem.$$("td"))[0].getText(),
        date: await (await elem.$$("td"))[1].getText()
      }
    })
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getPersonHeaderFromPopover()).waitForExist()
    await (await this.getPersonHeaderFromPopover()).waitForDisplayed()

    await browser.waitUntil(
      async() => {
        return (
          (await (await this.getFirstItemFromAdvancedSelect()).getText()) ===
          compareStr
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't find the searched person in time"
      }
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
        timeoutMsg: "Couldn't set the person in time"
      }
    )
  }

  async waitForSuccessAlert() {
    await browser.waitUntil(
      async() => {
        return (
          (await (await browser.$(".alert-success")).getText()) ===
          "People merged. Displaying merged Person below."
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Couldn't see the success alert in time"
      }
    )
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

export default new MergePeople()
