import { expect, test } from "@playwright/test"
import moment from "moment"
import ShowPersonPageObject from "../pages/showPerson.page.js"
import ShowPositionPageObject from "../pages/showPosition.page.js"

test.describe(() => {
  let ShowPerson, ShowPosition
  test.beforeEach(async ({ page }) => {
    ShowPerson = new ShowPersonPageObject(page)
    ShowPosition = new ShowPositionPageObject(page)
  })
  const PERSON_UUID = "39d02d26-49eb-43b5-9cec-344777213a67"
  const DATE_FORMAT = "DD-MM-YYYY"
  const HISTORY_INDEX = 1
  let origStartDate
  // let origEndDate

  test("As admin we should be able to edit position history", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 2)

    await test.step(
      "We should be able to edit position history for a person",
      async () => {
        await ShowPerson.openAsAdminUser(PERSON_UUID)
        await (
          await ShowPerson.getEditPositionButton()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await ShowPerson.getChangeAssignedPositionButton()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (await ShowPerson.getEditHistoryButton()).click()
        await (
          await ShowPerson.getEditHistoryDialog()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
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
        await (
          await ShowPerson.getEditHistoryDialog()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        await expect(await ShowPerson.getAlertDanger()).toHaveCount(0)
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "We should be able to edit position history for a position",
      async () => {
        await (await ShowPerson.getPreviousPositionLink(HISTORY_INDEX)).click()
        await (await ShowPosition.getEditHistoryButton()).click()
        await (
          await ShowPerson.getEditHistoryDialog()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await ShowPerson.getEditHistoryStartDate(HISTORY_INDEX)
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
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
        await (
          await ShowPerson.getEditHistoryDialog()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        await expect(await ShowPosition.getAlertDanger()).toHaveCount(0)
        await ShowPerson.logout()
      },
      { timeout: stepTimeout }
    )
  })
  test("As regular user we should not be able to edit our own position or history", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 1)

    await test.step(
      "We should not be able to edit position or history for self",
      async () => {
        const erinsUuid = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"
        await ShowPerson.open(erinsUuid)
        await (
          await ShowPerson.getCurrentPosition()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await ShowPerson.getEditPositionButton()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        await (
          await ShowPerson.getChangeAssignedPositionButton()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        await ShowPerson.logout()
      },
      { timeout: stepTimeout }
    )
  })
})
