import Page from "./page.js"

const PAGE_URL = "/reports/new"
const GRID_LOCATION_ID = "formCustomFields.gridLocation"
const RELATED_REPORT_ID = "formCustomFields.relatedReport"
const ADDITIONAL_ENGAGEMENTS_ID = "formCustomFields.additionalEngagementNeeded"
const ENGAGEMENT_TYPES_ID = "formCustomFields.multipleButtons"
const TRAINING_TOGGLED_FIELDS = {
  trainingEvent: "formCustomFields.trainingEvent",
  numberTrained: "formCustomFields.numberTrained",
  levelTrained: "formCustomFields.levelTrained",
  trainingDate: "formCustomFields.trainingDate"
}
const ADVISE_FIELDS = {
  systemProcess: "formCustomFields.systemProcess",
  itemsAgreed: "formCustomFields.itemsAgreed",
  echelons: "formCustomFields.echelons"
}
const OTHER_FIELDS = {
  assetsUsed: "formCustomFields.assetsUsed"
}
export class CreateReport extends Page {
  async getForm() {
    return this.page.locator("form").first()
  }

  async getAlert() {
    return this.page.locator(".alert").first()
  }

  async getDuration() {
    return this.page.locator("#duration").first()
  }

  async getPositiveAtmosphere() {
    return this.page.locator('label[for="atmosphere_POSITIVE"]').first()
  }

  async getCustomFieldFormGroup(id) {
    return this.page.locator(`div[id="fg-${id}"]`).first()
  }

  async getCustomFieldButtonFromText(id, text) {
    return this.page
      .locator(`//div[@id="fg-${id}"]//button[text()="${text}"]`)
      .first()
  }

  async getEngagementInformationTitle() {
    return this.page.locator('//span[text()="Engagement information"]').first()
  }

  async getGridLocationLatField() {
    return this.page.locator(`input[id="${GRID_LOCATION_ID}.lat"]`).first()
  }

  async getGridLocationLngField() {
    return this.page.locator(`input[id="${GRID_LOCATION_ID}.lng"]`).first()
  }

  async getGridLocationDisplayedCoordinateField() {
    return this.page
      .locator(`input[id="${GRID_LOCATION_ID}.displayedCoordinate"]`)
      .first()
  }

  async getGridLocationInfoButton() {
    return this.page
      .locator(`div[id="fg-${GRID_LOCATION_ID}"]`)
      .first()
      .locator('button[data-testid="info-button"]')
      .first()
  }

  async getGridLocationLatLonButton() {
    return this.page
      .locator(`button[name="${GRID_LOCATION_ID}.LAT_LON"]`)
      .first()
  }

  async getGridLocationMgrsButton() {
    return this.page.locator(`button[name="${GRID_LOCATION_ID}.MGRS"]`).first()
  }

  async getTestReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(RELATED_REPORT_ID)
  }

  async getTestReferenceFieldButton(buttonText) {
    return this.getCustomFieldButtonFromText(RELATED_REPORT_ID, buttonText)
  }

  async getTestReferenceFieldLabel() {
    return (await this.getTestReferenceFieldFormGroup())
      .locator(`label[for="${RELATED_REPORT_ID}"]`)
      .first()
  }

  async getTestReferenceFieldHelpText() {
    return (await this.getTestReferenceFieldFormGroup())
      .locator("div.form-text")
      .first()
  }

  async getTestReferenceField() {
    return (await this.getTestReferenceFieldFormGroup())
      .locator(`input[id="${RELATED_REPORT_ID}"]`)
      .first()
  }

  async getTestReferenceFieldAdvancedSelectFirstItem() {
    return this.page
      .locator(
        `div[id="${RELATED_REPORT_ID}-popover"] tbody tr:first-child td:nth-child(2)`
      )
      .first()
  }

  async getTestReferenceFieldValue() {
    return (await this.getTestReferenceFieldFormGroup())
      .locator(`table[id="${RELATED_REPORT_ID}-value"] tbody tr:first-child`)
      .first()
  }

  async getTestMultiReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(ADDITIONAL_ENGAGEMENTS_ID)
  }

  async getTestMultiReferenceFieldButton(buttonText) {
    return this.getCustomFieldButtonFromText(
      ADDITIONAL_ENGAGEMENTS_ID,
      buttonText
    )
  }

  async getTestMultiReferenceFieldLabel() {
    return (await this.getTestMultiReferenceFieldFormGroup())
      .locator(`label[for="${ADDITIONAL_ENGAGEMENTS_ID}"]`)
      .first()
  }

  async getTestMultiReferenceFieldIcon() {
    return (await this.getCustomFieldFormGroup(ADDITIONAL_ENGAGEMENTS_ID))
      .locator("span.input-group-text:last-child")
      .first()
  }

  async getTestMultiReferenceFieldHelpText() {
    return (await this.getTestMultiReferenceFieldFormGroup())
      .locator("div.form-text")
      .first()
  }

  async getTestMultiReferenceField() {
    return (await this.getTestMultiReferenceFieldFormGroup())
      .locator(`input[id="${ADDITIONAL_ENGAGEMENTS_ID}"]`)
      .first()
  }

  async getTestMultiReferenceFieldAdvancedSelect() {
    await this.page
      .locator(`div[id="${ADDITIONAL_ENGAGEMENTS_ID}-popover"] tbody`)
      .first()
      .waitFor({
        state: "attached",
        timeout: 10000
      })
    return this.page
      .locator(`div[id="${ADDITIONAL_ENGAGEMENTS_ID}-popover"] tbody`)
      .first()
  }

  async getEngagementTypesFieldFormGroup() {
    return this.getCustomFieldFormGroup(ENGAGEMENT_TYPES_ID)
  }

  async getEngagementTypesFieldLabel() {
    return (await this.getEngagementTypesFieldFormGroup())
      .locator(`label[for="${ENGAGEMENT_TYPES_ID}"]`)
      .first()
  }

  async getEngagementTypesButtonByName(name) {
    return (await this.getEngagementTypesFieldFormGroup())
      .locator(`label[for="formCustomFields.multipleButtons_${name}"]`)
      .first()
  }

  async getFieldsToggledVisibilityByTrainButton() {
    return Promise.all(
      Object.keys(TRAINING_TOGGLED_FIELDS).map(async fieldId => {
        return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS[fieldId])
      })
    )
  }

  async getFieldsNotToggledVisibilityByTrainButton() {
    return (
      await Promise.all(
        Object.keys(ADVISE_FIELDS).map(async fieldId => {
          return this.getCustomFieldFormGroup(ADVISE_FIELDS[fieldId])
        })
      )
    ).concat(
      await Promise.all(
        Object.keys(OTHER_FIELDS).map(async fieldsetId => {
          return this.page
            .locator(`div[id="${OTHER_FIELDS[fieldsetId]}"]`)
            .first()
        })
      )
    )
  }

  async getNumberTrainedFormGroup() {
    return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS.numberTrained)
  }

  async getNumberTrainedField() {
    return (await this.getNumberTrainedFormGroup())
      .locator(`input[id="${TRAINING_TOGGLED_FIELDS.numberTrained}"]`)
      .first()
  }

  async getNumberTrainedFieldShowed() {
    return (await this.getNumberTrainedFormGroup())
      .locator("div.form-control-plaintext")
      .first()
  }

  async getNumberTrainedErrorText() {
    return (await this.getNumberTrainedFormGroup())
      .locator("div.invalid-feedback")
      .first()
  }

  async getTestMultiReferenceFieldAdvancedSelectItem(n) {
    return (await this.getTestMultiReferenceFieldAdvancedSelect())
      .locator(`tr:nth-child(${n}) td:nth-child(2)`)
      .first()
  }

  async getTestMultiReferenceFieldAdvancedSelectItemLabel(n) {
    return (await this.getTestMultiReferenceFieldAdvancedSelectItem(n))
      .locator("span")
      .first()
  }

  async getTestMultiReferenceFieldValue() {
    return (await this.getTestMultiReferenceFieldFormGroup())
      .locator(`table[id="${ADDITIONAL_ENGAGEMENTS_ID}-value"]`)
      .first()
  }

  async getTestMultiReferenceFieldValueRows() {
    return (await this.getTestMultiReferenceFieldValue())
      .locator("tbody tr")
      .all()
  }

  async getTestMultiReferenceFieldValueRow(n) {
    return (await this.getTestMultiReferenceFieldValue())
      .locator(`tbody tr:nth-child(${n})`)
      .first()
  }

  async getAttendeesAssessments() {
    return this.page.locator("#attendees-engagement-assessments").first()
  }

  async getAttendeeAssessmentRows() {
    return (await this.getAttendeesAssessments()).locator("tr").all()
  }

  async getAttendeeAssessment(name) {
    return (await this.getAttendeesAssessments())
      .locator(`xpath=.//th//a[text()="${name}"]`)
      .first()
  }

  async getAttendeeAssessmentLabel(name, i) {
    return (await this.getAttendeeAssessment(name))
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..")
      .locator(`xpath=./following-sibling::tr[${i}]/td`)
      .first()
  }

  async getTasksAssessments() {
    return this.page.locator("#tasks-engagement-assessments").first()
  }

  async getTaskAssessmentRows() {
    return (await this.getTasksAssessments()).locator("tr").all()
  }

  async getTaskAssessment(shortName) {
    return (await this.getTasksAssessments())
      .locator(`xpath=.//th//a[text()="${shortName}"]`)
      .first()
  }

  async getTaskAssessmentLabel(shortName, i) {
    return (await this.getTaskAssessment(shortName))
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..")
      .locator(`xpath=./following-sibling::tr[${i}]/td`)
      .first()
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async getEditButton() {
    return this.page.locator('//a[text()="Edit"]').first()
  }

  async getCancelButton() {
    return this.page.locator('//button[text()="Cancel"]').first()
  }

  async getDeleteButton() {
    return this.page.locator('//button[text()="Delete this report"]').first()
  }

  async getConfirmButton() {
    return this.page.locator('//button[text()="Yes, I am sure"]').first()
  }

  async open(pathName = PAGE_URL, credentials = Page.DEFAULT_CREDENTIALS.user) {
    await super.open(pathName, credentials)
  }

  async openAs(user) {
    await super.open(PAGE_URL, user)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForAlertToLoad() {
    await (
      await this.getAlert()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
    await (
      await this.getSubmitButton()
    ).waitFor({
      state: "detached",
      timeout: 10000
    })
  }
}
export default CreateReport
