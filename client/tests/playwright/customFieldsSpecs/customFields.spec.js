import { expect, test } from "@playwright/test"
import CreatePersonPageObject from "../pages/createNewPerson.page.js"
import CreateReportPageObject from "../pages/createReport.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, CreatePerson, CreateReport
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    CreatePerson = new CreatePersonPageObject(page)
    CreateReport = new CreateReportPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const INVALID_NUMBER_INPUT = "-10"
  const VALID_NUMBER_INPUT = "10"
  const TRAIN_ENGAGEMENT_BUTTON = "train"
  const REQUIRED_PERSON_FIELDS = {
    familyName: "customPerson",
    rank: "CIV",
    gender: "MALE",
    country: "Türkiye"
  }
  test.describe("When working with custom fields for different anet objects", () => {
    // ------------------------------ REPORT CUSTOM FIELDS -----------------------------------------
    test.describe("For report's custom fields", () => {
      test("Should be able load a new report form", async () => {
        await CreateReport.openAsAdminUser()
        await (
          await CreateReport.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
      test("When the engagement type is not defined, it should not display fields only visible when a certain engagement type is selected", async () => {
        const toggleFields =
          await CreateReport.getFieldsToggledVisibilityByTrainButton()
        for (const invisField of toggleFields) {
          await expect(invisField).toHaveCount(0)
        }
        const notToggleFields =
          await CreateReport.getFieldsNotToggledVisibilityByTrainButton()
        for (const invisField of notToggleFields) {
          await expect(invisField).toHaveCount(0)
        }
      })
      test("Selecting the train engagement type should toggle the correct invisible fields", async () => {
        const trainButton = await CreateReport.getEngagementTypesButtonByName(
          TRAIN_ENGAGEMENT_BUTTON
        )
        await trainButton.click()
        const toggleFields =
          await CreateReport.getFieldsToggledVisibilityByTrainButton()
        for (const nowVisibleField of toggleFields) {
          await nowVisibleField.waitFor({
            state: "visible",
            timeout: 10000
          })
        }
        // train button active here so numberField will be visible

        const notToggleFields =
          await CreateReport.getFieldsNotToggledVisibilityByTrainButton()
        for (const stillInvisField of notToggleFields) {
          await expect(stillInvisField).toHaveCount(0)
        }
      })
      test("Should persist previous valid data when toggling field's visibility", async () => {
        await (
          await CreateReport.getNumberTrainedField()
        ).fill(String(VALID_NUMBER_INPUT))
        const trainButton = await CreateReport.getEngagementTypesButtonByName(
          TRAIN_ENGAGEMENT_BUTTON
        )
        // turn off train option to make numberField invisible
        await trainButton.click()
        await (
          await CreateReport.getNumberTrainedFormGroup()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        // turn on train option to make numberField visible
        await trainButton.click()
        await (
          await CreateReport.getNumberTrainedFormGroup()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        await expect(await CreateReport.getNumberTrainedField()).toHaveValue(
          VALID_NUMBER_INPUT
        )
      })
      test("Should persist previous invalid data when toggling field's visibility", async () => {
        await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
        await (
          await CreateReport.getNumberTrainedField()
        ).fill(String(INVALID_NUMBER_INPUT))
        // Actually see the validation warning
        await expect(await CreateReport.getNumberTrainedErrorText()).toHaveText(
          "Number trained must be greater than or equal to 1",
          {
            useInnerText: true
          }
        )
        const trainButton = await CreateReport.getEngagementTypesButtonByName(
          TRAIN_ENGAGEMENT_BUTTON
        )
        // turn off train option to make numberField invisible
        await trainButton.click()
        await (
          await CreateReport.getNumberTrainedFormGroup()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        // turn on train option to make numberField visible
        await trainButton.click()
        await (
          await CreateReport.getNumberTrainedFormGroup()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        await expect(await CreateReport.getNumberTrainedField()).toHaveValue(
          INVALID_NUMBER_INPUT
        )
      })
      test("Should validate visible field", async () => {
        await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
        await (
          await CreateReport.getNumberTrainedField()
        ).fill(String(INVALID_NUMBER_INPUT))
        await expect(
          await CreateReport.getNumberTrainedErrorText()
        ).toContainText("Number trained must be greater than or equal to 1", {
          useInnerText: true
        })
        await CreateReport.submitForm()
        await CreateReport.waitForAlertToLoad()
        await expect(await CreateReport.getAlertDanger()).toContainText(
          "Number trained must be greater than or equal to 1",
          {
            useInnerText: true
          }
        )
      })
      test("Should not validate invisible field", async () => {
        await (await CreateReport.getEditButton()).click()
        await (
          await CreateReport.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const trainButton = await CreateReport.getEngagementTypesButtonByName(
          TRAIN_ENGAGEMENT_BUTTON
        )
        // turn off train option to make numberField invisible
        // It was invalid from previous test case
        await trainButton.click()
        await CreateReport.submitForm()
        await CreateReport.waitForAlertToLoad()
        await expect(await CreateReport.getAlertDanger()).not.toContainText(
          "Number trained must be greater than or equal to 1",
          {
            useInnerText: true
          }
        )
      })
      test("Should show valid visible field after saving", async () => {
        // we are on show page after submitting
        await (await CreateReport.getEditButton()).click()
        await (
          await CreateReport.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const trainButton = await CreateReport.getEngagementTypesButtonByName(
          TRAIN_ENGAGEMENT_BUTTON
        )
        // turn on train option to make numberField visible
        await trainButton.click()
        await (
          await CreateReport.getNumberTrainedFormGroup()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
        await (
          await CreateReport.getNumberTrainedField()
        ).fill(String(VALID_NUMBER_INPUT))
        await CreateReport.submitForm()
        await CreateReport.waitForAlertToLoad()
        await expect(
          await CreateReport.getNumberTrainedFieldShowed()
        ).toContainText(VALID_NUMBER_INPUT.toString(), {
          useInnerText: true
        })
      })
      test("Should logout", async () => {
        await CreateReport.logout()
      })
    })
    // ------------------------------ PERSON CUSTOM FIELDS -----------------------------------------
    test.describe("For person's custom fields", () => {
      test("Should be able load a new person form and fill normal required fields", async () => {
        await CreatePerson.openAsAdmin()
        await (
          await CreatePerson.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // fill other required fields at the beginning
        await (
          await CreatePerson.getFamilyName()
        ).fill(String(REQUIRED_PERSON_FIELDS.familyName))
        await (
          await CreatePerson.getRank()
        ).selectOption(REQUIRED_PERSON_FIELDS.rank)
        await (
          await CreatePerson.getGender()
        ).selectOption(REQUIRED_PERSON_FIELDS.gender)
        await (await CreatePerson.getCountryInput()).click()
        await (
          await CreatePerson.getCountryInput()
        ).fill(String(REQUIRED_PERSON_FIELDS.country))
        await CreatePerson.waitForCountryAdvancedSelectToChange(
          REQUIRED_PERSON_FIELDS.country
        )
        await expect(
          await CreatePerson.getCountryAdvancedSelectFirstItem()
        ).toContainText(REQUIRED_PERSON_FIELDS.country, {
          useInnerText: true
        })
        await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
        await (
          await CreatePerson.getCountryHelpBlock()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
      })
      test("Should not show default invisible fields", async () => {
        const fields = await CreatePerson.getDefaultInvisibleCustomFields()
        for (const field of fields) {
          await expect(field).toHaveCount(0)
        }
        // Date field is invisible by default
        await (await CreatePerson.getAddArrayObjectButton()).click()
        await (
          await CreatePerson.getObjectDateField()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
      })
      test("Should toggle correct invisible fields", async () => {
        // green toggles every invisible field to visible
        await (await CreatePerson.getGreenButton()).click()
        const fields = await CreatePerson.getDefaultInvisibleCustomFields()
        for (const field of fields) {
          await field.waitFor({
            state: "attached",
            timeout: 10000
          })
        }
        // Also it toggles array_of_objects date field
        await (
          await CreatePerson.getObjectDateField()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
      })
      test("Should persist previous valid data when toggling field's visibility", async () => {
        await (
          await CreatePerson.getNumberCustomField()
        ).fill(String(VALID_NUMBER_INPUT))
        // make default invisible fields invisible again, amber color does that
        await (await CreatePerson.getAmberButton()).click()
        await (
          await CreatePerson.getNumberCustomFieldContainer()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        // make visible
        await (await CreatePerson.getGreenButton()).click()
        await (
          await CreatePerson.getNumberCustomFieldContainer()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        await expect(await CreatePerson.getNumberCustomField()).toHaveValue(
          VALID_NUMBER_INPUT
        )
      })
      test("Should persist previous invalid data when toggling field's visibility", async () => {
        await CreatePerson.deleteInput(CreatePerson.getNumberCustomField())
        await (
          await CreatePerson.getNumberCustomField()
        ).fill(String(INVALID_NUMBER_INPUT))
        // Actually see the validation warning
        await (
          await CreatePerson.getNumberCustomFieldHelpText()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        // make invisible
        await (await CreatePerson.getAmberButton()).click()
        await (
          await CreatePerson.getNumberCustomFieldContainer()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        // make visible
        await (await CreatePerson.getGreenButton()).click()
        await (
          await CreatePerson.getNumberCustomFieldContainer()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        await expect(await CreatePerson.getNumberCustomField()).toHaveValue(
          INVALID_NUMBER_INPUT
        )
      })
      test("Should validate visible field", async () => {
        await CreatePerson.deleteInput(CreatePerson.getNumberCustomField())
        await (
          await CreatePerson.getNumberCustomField()
        ).fill(String(INVALID_NUMBER_INPUT))
        await expect(
          await CreatePerson.getNumberCustomFieldHelpText()
        ).toContainText("greater than", {
          useInnerText: true
        })
      })
      test("Should not validate invisible field so we can submit the form", async () => {
        // make invisible
        await (await CreatePerson.getAmberButton()).click()
        await (
          await CreatePerson.getNumberCustomFieldContainer()
        ).waitFor({
          state: "detached",
          timeout: 10000
        })
        // wait for the rendering of custom fields
        await CreatePerson.submitForm()
        await CreatePerson.waitForAlertSuccessToLoad()
      })
      test("Should logout", async () => {
        await CreatePerson.logout()
      })
    })
  })
})
