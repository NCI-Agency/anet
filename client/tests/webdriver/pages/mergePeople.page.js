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
    return browser.$(".bp6-popover-content")
  }

  async getPersonHeaderFromPopover() {
    return browser.$('//table//th[contains(text(), "Name")]')
  }

  async getFirstItemFromAdvancedSelect() {
    return browser.$("table > tbody > tr:first-child > td:nth-child(2) > span")
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return browser.$(
      "table > tbody > tr:first-child > td:first-child > input.form-check-input"
    )
  }

  async getMergePeopleButton() {
    return browser.$('//button[text()="Merge People"]')
  }

  async getShowNotesButton() {
    return browser.$('button[title="Show notes"]')
  }

  async getPrimaryPosition() {
    return browser.$("#position a.position-name")
  }

  async getAdditionalPositions() {
    const additionalPositions = await browser.$$(
      "#additionalPositions a.position-name"
    )
    return additionalPositions.map(
      async additionalPosition => await additionalPosition.getText()
    )
  }

  async getPositionCurrentPersonName() {
    return browser.$("h4.assigned-person-name")
  }

  async getUnoccupiedPositionPersonMessage() {
    return browser.$("p.position-empty-message")
  }

  async getNoteCards() {
    return browser.$$(".offcanvas .card")
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return browser.$(`#mid-merge-per-col ${button} > button`)
  }

  async getSelectButton(side, text) {
    const buttonDiv = await browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]`
    )
    const button = await buttonDiv.parentElement().parentElement()
    return button.$("small > button")
  }

  async getColumnContent(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]/following-sibling::div`
    )
  }

  async getSingleSelectButton(side, text) {
    return browser.$(
      `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]` +
        "/parent::div/following-sibling::small[1]/button"
    )
  }

  async getPreviousPositions(side) {
    const previousPositionsElements = await browser.$$(
      `//div[@id="${side}-merge-per-col"]//div[text()="Previous Positions"]/following-sibling::div//table//tbody//tr`
    )
    return await previousPositionsElements.map(async elem => ({
      name: await (await elem.$$("td"))[0].getText(),
      date: await (await elem.$$("td"))[1].getText()
    }))
  }

  async getPreviousPositionsElements(primary) {
    const previousPrimaryPositionsElements = await browser.$$(
      `${primary ? "#fg-prevPositions" : "#fg-prevAdditionalPositions"} table#previous-positions tbody tr`
    )
    return await previousPrimaryPositionsElements.map(async elem => ({
      name: `${await (await elem.$$("td"))[0].getText()}`,
      date: await (await elem.$$("td"))[1].getText()
    }))
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (await this.getAdvancedSelectPopover()).waitForExist()
    await (await this.getAdvancedSelectPopover()).waitForDisplayed()
    await (await this.getPersonHeaderFromPopover()).waitForExist()
    await (await this.getPersonHeaderFromPopover()).waitForDisplayed()
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect,
      compareStr
    )
  }

  async waitForColumnToChange(compareStr, side, text) {
    return this.waitForElementToChange(
      async () => this.getColumnContent(side, text),
      compareStr
    )
  }

  async waitForSuccessAlert() {
    return this.waitForElementToChange(
      this.getAlertSuccess,
      "People merged. Displaying merged Person below."
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

  async getUserAccountsField() {
    return browser.$("#fg-users")
  }
}

export default new MergePeople()
