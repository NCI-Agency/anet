import Page from "./page.js"

const PATH = "/admin/merge/positions"
class MergePositions extends Page {
  async openPage(path = PATH) {
    await super.openAsAdminUser(path)
  }

  async getErrorTitle() {
    return this.page.locator("//h1").first()
  }

  async getTitle() {
    return this.page.locator('//h4[contains(text(),"Merge Positions")]').first()
  }

  async getLeftPositionField() {
    return this.page.locator("#Position1").first()
  }

  async getRightPositionField() {
    return this.page.locator("#Position2").first()
  }

  async getAdvancedSelectPopover() {
    return this.page.locator(".bp6-popover-content").first()
  }

  async getPositionHeaderFromPopover() {
    return this.page
      .locator('//table//th[contains(text(), "Position")]')
      .first()
  }

  async getFirstItemFromAdvancedSelect() {
    return this.page
      .locator(
        ".advanced-select-popover table > tbody > tr:first-child > td:nth-child(2) > span"
      )
      .first()
  }

  async getFirstItemRadioButtonFromAdvancedSelect() {
    return this.page
      .locator(
        "table > tbody > tr:first-child > td:first-child > input.form-check-input"
      )
      .first()
  }

  async getEditAssociatedPositionsButton() {
    return this.page
      .locator('//button[text()="Edit Associated Positions"]')
      .first()
  }

  async getEditAssociatedPositionsModal() {
    return this.page
      .locator("//div[contains(@class, 'edit-associated-positions-dialog')]")
      .first()
  }

  async getSaveAssociatedPositionsButton() {
    return (await this.getEditAssociatedPositionsModal())
      .locator('xpath=.//button[text()="Save"]')
      .first()
  }

  async getMergePositionsButton() {
    return this.page.locator('//button[text()="Merge Positions"]').first()
  }

  async getOccupiedPositionsToast() {
    return this.page
      .locator('//div[text()="Please select at least one unoccupied position"]')
      .first()
  }

  async getWinnerAssociatedPositions() {
    const associatedPositionRows = await this.page
      .locator("#assigned-counterpart tbody tr")
      .all()
    return await Promise.all(
      associatedPositionRows.map(async elem => {
        return {
          person: (
            await (await elem.locator("td").all())[0].innerText()
          ).trim(),
          position: (
            await (await elem.locator("td").all())[1].innerText()
          ).trim()
        }
      })
    )
  }

  async getShowNotesButton() {
    return this.page.locator('button[title="Show notes"]').first()
  }

  async getNoteCards() {
    return this.page.locator(".offcanvas .card").all()
  }

  async getUseAllButton(side) {
    const button = side === "left" ? "small:first-child" : "small:last-child"
    return this.page.locator(`#mid-merge-pos-col ${button} > button`).first()
  }

  async getSelectButton(side, text) {
    const buttonDiv = await this.page
      .locator(`//div[@id="${side}-merge-pos-col"]//div[text()="${text}"]`)
      .first()
    const button = await buttonDiv.locator("..").locator("..")
    return button.locator("small > button").first()
  }

  async getColumnContent(side, text) {
    return this.page
      .locator(
        `//div[@id="${side}-merge-pos-col"]//div[text()="${text}"]/following-sibling::div`
      )
      .first()
  }

  async getAssociatedPositions(side) {
    const associatedPositionElements = await this.page
      .locator(
        `//div[@id="${side}-merge-pos-col"]//div[text()="Associated Positions"]//following-sibling::div//table//tbody//tr`
      )
      .all()
    return await Promise.all(
      associatedPositionElements.map(async elem => {
        return {
          person: (
            await (await elem.locator("td").all())[0].innerText()
          ).trim(),
          position: (
            await (await elem.locator("td").all())[1].innerText()
          ).trim()
        }
      })
    )
  }

  async getPreviousPeople(side) {
    const previousPeopleElements = await this.page
      .locator(
        `//div[@id="${side}-merge-pos-col"]//div[text()="Previous People"]/following-sibling::div//table//tbody//tr`
      )
      .all()
    return await Promise.all(
      previousPeopleElements.map(async elem => {
        return {
          name: (await (await elem.locator("td").all())[0].innerText()).trim(),
          date: (await (await elem.locator("td").all())[1].innerText()).trim()
        }
      })
    )
  }

  async waitForAdvancedSelectLoading(compareStr) {
    await (
      await this.getAdvancedSelectPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await (
      await this.getPositionHeaderFromPopover()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    return this.waitForElementToChange(
      this.getFirstItemFromAdvancedSelect.bind(this),
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
      this.getAlertSuccess.bind(this),
      "Positions merged. Displaying merged Position below."
    )
  }

  async getAssociatedPositionsInModal(side) {
    const selectedSide = await this.page
      .locator(`#edit-ap-${side} tbody tr`)
      .all()
    return await Promise.all(
      selectedSide.map(async elem => {
        return {
          // On the right column first td is button while on the other columns last td is the button
          person: (
            await (
              await elem.locator("td").all()
            )[side === "right" ? 1 : 0].innerText()
          ).trim(),
          position: (
            await (
              await elem.locator("td").all()
            )[side === "right" ? 2 : 1].innerText()
          ).trim()
        }
      })
    )
  }

  async getAssociatedPositionActionButton(side, index) {
    const selectedRow = (
      await this.page.locator(`#edit-ap-${side} tbody tr`).all()
    )[index]
    return (await selectedRow.locator("td").all())[side === "right" ? 0 : 2]
      .locator("button")
      .first()
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
}
export default MergePositions
