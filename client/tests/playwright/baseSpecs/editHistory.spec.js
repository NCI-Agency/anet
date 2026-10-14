import { expect as pwExpect } from "@playwright/test"
import moment from "moment"
import ShowPerson from "../pages/showPerson.page.js"
import ShowPosition from "../pages/showPosition.page.js"
import { test, waitFor } from "../support.js"

const PERSON_UUID = "39d02d26-49eb-43b5-9cec-344777213a67"
const DATE_FORMAT = "DD-MM-YYYY"
const HISTORY_INDEX = 1
let origStartDate
// let origEndDate

test.describe("As admin we should be able to edit position history", () => {
  test("We should be able to edit position history for a person", async () => {
    await ShowPerson.openAsAdminUser(PERSON_UUID)
    await waitFor(await ShowPerson.getEditPositionButton(), "attached")
    await waitFor(await ShowPerson.getEditPositionButton(), "visible")
    await waitFor(
      await ShowPerson.getChangeAssignedPositionButton(),
      "attached"
    )
    await waitFor(await ShowPerson.getChangeAssignedPositionButton(), "visible")
    await (await ShowPerson.getEditHistoryButton()).click()
    await waitFor(await ShowPerson.getEditHistoryDialog(), "attached")
    await waitFor(await ShowPerson.getEditHistoryDialog(), "visible")
    await waitFor(
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX),
      "attached"
    )
    await waitFor(
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX),
      "visible"
    )
    origStartDate = await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).inputValue()
    const newStartDate = moment(origStartDate, DATE_FORMAT)
      .subtract(1, "day")
      .format(DATE_FORMAT)
    await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).fill(String(newStartDate))
    /* TODO I can not make this one work
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
     */
    await (await ShowPerson.getEditHistorySubmitButton()).click()
    await waitFor(await ShowPerson.getEditHistoryDialog(), "attached", {
      reverse: true
    })
    await pwExpect(await ShowPerson.getAlertDanger()).toHaveCount(0)
  })
  test("We should be able to edit position history for a position", async () => {
    await (await ShowPerson.getPreviousPositionLink(HISTORY_INDEX)).click()
    await waitFor(await ShowPosition.getEditHistoryButton(), "attached")
    await waitFor(await ShowPosition.getEditHistoryButton(), "visible")
    await (await ShowPosition.getEditHistoryButton()).click()
    await waitFor(await ShowPerson.getEditHistoryDialog(), "attached")
    await waitFor(await ShowPerson.getEditHistoryDialog(), "visible")
    await waitFor(
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX),
      "attached"
    )
    await waitFor(
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX),
      "visible"
    )
    await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
    ).fill(String(origStartDate))
    /* TODO I can not make this one work
     await ShowPerson.deleteInput(
      ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    )
    await (
      await ShowPerson.getEditHistoryEndDate(HISTORY_INDEX)
    ).setValue(origEndDate)
     */
    await (await ShowPerson.getEditHistorySubmitButton()).click()
    await waitFor(await ShowPerson.getEditHistoryDialog(), "attached", {
      reverse: true
    })
    await pwExpect(await ShowPosition.getAlertDanger()).toHaveCount(0)
    await ShowPerson.logout()
  })
})
test.describe("As regular user we should not be able to edit our own position or history", () => {
  test("We should not be able to edit position or history for self", async () => {
    const erinsUuid = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"
    await ShowPerson.open(erinsUuid)
    await waitFor(await ShowPerson.getCurrentPosition(), "attached")
    await waitFor(await ShowPerson.getCurrentPosition(), "visible")
    await waitFor(await ShowPerson.getEditPositionButton(), "attached", {
      reverse: true
    })
    await waitFor(
      await ShowPerson.getChangeAssignedPositionButton(),
      "attached",
      {
        reverse: true
      }
    )
    await ShowPerson.logout()
  })
})
