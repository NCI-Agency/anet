import { expect } from "chai"
import moment from "moment"
import ShowPerson from "../pages/showPerson.page"
import ShowPosition from "../pages/showPosition.page"

const PERSON_UUID = "39d02d26-49eb-43b5-9cec-344777213a67"
const DATE_FORMAT = "DD-MM-YYYY"
const HISTORY_INDEX = 0
let origStartDate
let origEndDate

describe("As admin we should be able to edit position history", () => {
  it("We should be able to edit position history for a person", async () => {
    await ShowPerson.openAsAdminUser(PERSON_UUID)
    await (await ShowPerson.getEditPositionButton()).waitForExist()
    await (await ShowPerson.getEditPositionButton()).waitForDisplayed()
    await (await ShowPerson.getChangeAssignedPositionButton()).waitForExist()
    await (
      await ShowPerson.getChangeAssignedPositionButton()
    ).waitForDisplayed()
    await (await ShowPerson.getEditHistoryButton()).click()
    await (await ShowPerson.getEditHistoryDialog()).waitForExist()
    await (await ShowPerson.getEditHistoryDialog()).waitForDisplayed()
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).waitForExist()
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).waitForDisplayed()
    origStartDate = await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).getValue()
    const newStartDate = moment(origStartDate, DATE_FORMAT)
      .subtract(1, "day")
      .format(DATE_FORMAT)
    await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).setValue(newStartDate)
    origEndDate = await (
      await ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    ).getValue()
    const newEndDate = moment(origEndDate, DATE_FORMAT)
      .subtract(1, "day")
      .format(DATE_FORMAT)
    await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    ).setValue(newEndDate)
    await (await ShowPerson.getEditHistorySubmitButton()).click()
    await (
      await ShowPerson.getEditHistoryDialog()
    ).waitForExist({ reverse: true })
    // eslint-disable-next-line no-unused-expressions
    expect(await (await ShowPerson.getAlertDanger()).isExisting()).to.be.false
  })
  it("We should be able to edit position history for a position", async () => {
    await (await ShowPerson.getPreviousPositionLink(HISTORY_INDEX)).click()
    await (await ShowPosition.getEditHistoryButton()).waitForExist()
    await (await ShowPosition.getEditHistoryButton()).waitForDisplayed()
    await (await ShowPosition.getEditHistoryButton()).click()
    await (await ShowPerson.getEditHistoryDialog()).waitForExist()
    await (await ShowPerson.getEditHistoryDialog()).waitForDisplayed()
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).waitForExist()
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).waitForDisplayed()
    await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).setValue(origStartDate)
    await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    ).setValue(origEndDate)
    await (await ShowPerson.getEditHistorySubmitButton()).click()
    await (
      await ShowPerson.getEditHistoryDialog()
    ).waitForExist({ reverse: true })
    // eslint-disable-next-line no-unused-expressions
    expect(await (await ShowPosition.getAlertDanger()).isExisting()).to.be.false
    await ShowPerson.logout()
  })
})

describe("As regular user we should not be able to edit our own position or history", () => {
  it("We should not be able to edit position or history for self", async () => {
    const erinsUuid = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"
    await ShowPerson.open(erinsUuid)
    await (await ShowPerson.getCurrentPosition()).waitForExist()
    await (await ShowPerson.getCurrentPosition()).waitForDisplayed()
    await (
      await ShowPerson.getEditPositionButton()
    ).waitForExist({ reverse: true })
    await (
      await ShowPerson.getChangeAssignedPositionButton()
    ).waitForExist({ reverse: true })
    await ShowPerson.logout()
  })
})
