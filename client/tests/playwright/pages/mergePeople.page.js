import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PATH = "/admin/merge/people"

class MergePeople extends Page {
  async openPage(path = PATH) {
    await super.openAsAdminUser(path)
  }

  async getErrorTitle() {
    return currentPage().locator("//h1").first()
  }

  async getTitle() {
    return currentPage()
      .locator('//h4[contains(text(),"Merge People")]')
      .first()
  }

  async getLeftPersonField() {
    return currentPage().locator("#Person1").first()
  }

  async getRightPersonField() {
    return currentPage().locator("#Person2").first()
  }

  async getAdvancedSelectPopover() {
    return currentPage().locator(".bp6-popover-content").first()
  }

  async getPersonHeaderFromPopover() {
    return currentPage()
      .locator('//table//th[contains(text(), "Name")]')
      .first()
  }

  async getFirstItemFromAdvancedSelect() {
    return currentPage()
      .locator("table > tbody > tr:first-child > td:nth-child(2) > span")
      .first()
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return currentPage()
      .locator(
        "table > tbody > tr:first-child > td:first-child > input.form-check-input"
      )
      .first()
  }

  async getMergePeopleButton() {
    return currentPage().locator('//button[text()="Merge People"]').first()
  }

  async getShowNotesButton() {
    return currentPage().locator('button[title="Show notes"]').first()
  }

  async getPrimaryPosition() {
    return currentPage().locator("#position a.position-name").first()
  }

  async getAdditionalPositions() {
    const additionalPositions = await currentPage()
      .locator("#additionalPositions a.position-name")
      .all()
    return Promise.all(
      additionalPositions.map(async additionalPosition =>
        (await additionalPosition.innerText()).trim()
      )
    )
  }

  async getPositionCurrentPersonName() {
    return currentPage().locator("h4.assigned-person-name").first()
  }

  async getUnoccupiedPositionPersonMessage() {
    return currentPage().locator("p.position-empty-message").first()
  }

  async getNoteCards() {
    return currentPage().locator(".offcanvas .card").all()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return currentPage()
      .locator(`#mid-merge-per-col ${button} > button`)
      .first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await currentPage()
      .locator(`//div[@id="${side}-merge-per-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getColumnContent(side, text) {
    return currentPage()
      .locator(
        `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getSingleSelectButton(side, text) {
    return currentPage()
      .locator(
        `//div[@id="${side}-merge-per-col"]//div[text()="${text}"]` +
          "/parent::div/following-sibling::small[1]/button"
      )
      .first()
  }

  async getPreviousPositions(side) {
    const previousPositionsElements = await currentPage()
      .locator(
        `//div[@id="${side}-merge-per-col"]//div[text()="Previous Positions"]/following-sibling::div//table//tbody//tr`
      )
      .all()
    return await Promise.all(
      previousPositionsElements.map(async elem => ({
        name: (await (await elem.locator("td").all())[0].innerText()).trim(),
        date: (await (await elem.locator("td").all())[1].innerText()).trim()
      }))
    )
  }

  async getPreviousPositionsElements(primary) {
    const previousPrimaryPositionsElements = await currentPage()
      .locator(
        `${primary ? "#fg-prevPositions" : "#fg-prevAdditionalPositions"} table#previous-positions tbody tr`
      )
      .all()
    return await Promise.all(
      previousPrimaryPositionsElements.map(async elem => ({
        name: `${(await (await elem.locator("td").all())[0].innerText()).trim()}`,
        date: (await (await elem.locator("td").all())[1].innerText()).trim()
      }))
    )
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await waitFor(await this.getAdvancedSelectPopover(), "visible")
    await waitFor(await this.getPersonHeaderFromPopover(), "visible")
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
    const allNoteTexts = await Promise.all(
      noteCards.map(async card =>
        (
          await (await card.locator(".card-body > div").first()).innerText()
        ).trim()
      )
    )
    for (const note of notes) {
      if (!allNoteTexts.includes(note)) {
        areExist = false
      }
    }
    return areExist
  }

  async getUserAccountsField() {
    return currentPage().locator("#fg-users").first()
  }
}

export default new MergePeople()
