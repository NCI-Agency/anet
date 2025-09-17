import Page from "./page"

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
    return browser.$("form")
  }

  async getAlert() {
    return browser.$(".alert")
  }

  async getDuration() {
    return browser.$("#duration")
  }

  async getPositiveAtmosphere() {
    return browser.$('label[for="atmosphere_POSITIVE"]')
  }

  async getCustomFieldFormGroup(id) {
    return browser.$(`div[id="fg-${id}"]`)
  }

  async getCustomFieldButtonFromText(id, text) {
    return browser.$(`//div[@id="fg-${id}"]//button[text()="${text}"]`)
  }

  async getEngagementInformationTitle() {
    return browser.$('//span[text()="Engagement information"]')
  }

  async getGridLocationLatField() {
    return browser.$(`input[id="${GRID_LOCATION_ID}.lat"]`)
  }

  async getGridLocationLngField() {
    return browser.$(`input[id="${GRID_LOCATION_ID}.lng"]`)
  }

  async getGridLocationDisplayedCoordinateField() {
    return browser.$(`input[id="${GRID_LOCATION_ID}.displayedCoordinate"]`)
  }

  async getGridLocationInfoButton() {
    return browser
      .$(`div[id="fg-${GRID_LOCATION_ID}"]`)
      .$('button[data-testid="info-button"]')
  }

  async getGridLocationLatLonButton() {
    return browser.$(`button[name="${GRID_LOCATION_ID}.LAT_LON"]`)
  }

  async getGridLocationMgrsButton() {
    return browser.$(`button[name="${GRID_LOCATION_ID}.MGRS"]`)
  }

  async getTestReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(RELATED_REPORT_ID)
  }

  async getTestReferenceFieldButton(buttonText) {
    return this.getCustomFieldButtonFromText(RELATED_REPORT_ID, buttonText)
  }

  async getTestReferenceFieldLabel() {
    return (await this.getTestReferenceFieldFormGroup()).$(
      `label[for="${RELATED_REPORT_ID}"]`
    )
  }

  async getTestReferenceFieldHelpText() {
    return (await this.getTestReferenceFieldFormGroup()).$("div.form-text")
  }

  async getTestReferenceField() {
    return (await this.getTestReferenceFieldFormGroup()).$(
      `input[id="${RELATED_REPORT_ID}"]`
    )
  }

  async getTestReferenceFieldAdvancedSelectFirstItem() {
    return browser.$(
      `div[id="${RELATED_REPORT_ID}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  async getTestReferenceFieldValue() {
    return (await this.getTestReferenceFieldFormGroup()).$(
      `table[id="${RELATED_REPORT_ID}-value"] tbody tr:first-child`
    )
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
    return (await this.getTestMultiReferenceFieldFormGroup()).$(
      `label[for="${ADDITIONAL_ENGAGEMENTS_ID}"]`
    )
  }

  async getTestMultiReferenceFieldIcon() {
    return (await this.getCustomFieldFormGroup(ADDITIONAL_ENGAGEMENTS_ID)).$(
      "span.input-group-text"
    )
  }

  async getTestMultiReferenceFieldHelpText() {
    return (await this.getTestMultiReferenceFieldFormGroup()).$("div.form-text")
  }

  async getTestMultiReferenceField() {
    return (await this.getTestMultiReferenceFieldFormGroup()).$(
      `input[id="${ADDITIONAL_ENGAGEMENTS_ID}"]`
    )
  }

  async getTestMultiReferenceFieldAdvancedSelect() {
    await browser
      .$(`div[id="${ADDITIONAL_ENGAGEMENTS_ID}-popover"] tbody`)
      .waitForExist()
    return browser.$(`div[id="${ADDITIONAL_ENGAGEMENTS_ID}-popover"] tbody`)
  }

  async getEngagementTypesFieldFormGroup() {
    return this.getCustomFieldFormGroup(ENGAGEMENT_TYPES_ID)
  }

  async getEngagementTypesFieldLabel() {
    return (await this.getEngagementTypesFieldFormGroup()).$(
      `label[for="${ENGAGEMENT_TYPES_ID}"]`
    )
  }

  async getEngagementTypesButtonByName(name) {
    return (await this.getEngagementTypesFieldFormGroup()).$(
      `label[for="formCustomFields.multipleButtons_${name}"]`
    )
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
          return browser.$(`div[id="${OTHER_FIELDS[fieldsetId]}"]`)
        })
      )
    )
  }

  async getNumberTrainedFormGroup() {
    return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS.numberTrained)
  }

  async getNumberTrainedField() {
    return (await this.getNumberTrainedFormGroup()).$(
      `input[id="${TRAINING_TOGGLED_FIELDS.numberTrained}"]`
    )
  }

  async getNumberTrainedFieldShowed() {
    return (await this.getNumberTrainedFormGroup()).$(
      "div.form-control-plaintext"
    )
  }

  async getNumberTrainedErrorText() {
    return (await this.getNumberTrainedFormGroup()).$("div.invalid-feedback")
  }

  async getTestMultiReferenceFieldAdvancedSelectItem(n) {
    return (await this.getTestMultiReferenceFieldAdvancedSelect()).$(
      `tr:nth-child(${n}) td:nth-child(2)`
    )
  }

  async getTestMultiReferenceFieldAdvancedSelectItemLabel(n) {
    return (await this.getTestMultiReferenceFieldAdvancedSelectItem(n)).$(
      "span"
    )
  }

  async getTestMultiReferenceFieldValue() {
    return (await this.getTestMultiReferenceFieldFormGroup()).$(
      `table[id="${ADDITIONAL_ENGAGEMENTS_ID}-value"]`
    )
  }

  async getTestMultiReferenceFieldValueRows() {
    return (await this.getTestMultiReferenceFieldValue()).$$("tbody tr")
  }

  async getTestMultiReferenceFieldValueRow(n) {
    return (await this.getTestMultiReferenceFieldValue()).$(
      `tbody tr:nth-child(${n})`
    )
  }

  async getAttendeesAssessments() {
    return browser.$("#attendees-engagement-assessments")
  }

  async getAttendeeAssessmentRows() {
    return (await this.getAttendeesAssessments()).$$("tr")
  }

  async getAttendeeAssessment(name) {
    return (await this.getAttendeesAssessments()).$(
      `.//th//a[text()="${name}"]`
    )
  }

  async getAttendeeAssessmentLabel(name, i) {
    return (await this.getAttendeeAssessment(name))
      .parentElement()
      .parentElement()
      .parentElement()
      .$(`./following-sibling::tr[${i}]/td`)
  }

  async getTasksAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  async getTaskAssessmentRows() {
    return (await this.getTasksAssessments()).$$("tr")
  }

  async getTaskAssessment(shortName) {
    return (await this.getTasksAssessments()).$(
      `.//th//a[text()="${shortName}"]`
    )
  }

  async getTaskAssessmentLabel(shortName, i) {
    return (await this.getTaskAssessment(shortName))
      .parentElement()
      .parentElement()
      .parentElement()
      .parentElement()
      .$(`./following-sibling::tr[${i}]/td`)
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getEditButton() {
    return browser.$('//a[text()="Edit"]')
  }

  async getCancelButton() {
    return browser.$('//button[text()="Cancel"]')
  }

  async getDeleteButton() {
    return browser.$('//button[text()="Delete this report"]')
  }

  async getConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
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
    await (await this.getAlert()).waitForExist()
    await (await this.getAlert()).waitForDisplayed()
  }

  async waitForAdvancedSelectToChange(item, value) {
    await (await item).waitForExist()
    return browser.waitUntil(
      async () => {
        return (await (await item).getText()) === value
      },
      {
        timeout: 5000,
        timeoutMsg: `Expected advanced select input to contain "${value}" after 5s, but was "${await (
          await item
        ).getText()}"`
      }
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).waitForClickable()
    await (await this.getSubmitButton()).click()
    await (await this.getSubmitButton()).waitForExist({ reverse: true })
  }
}

export default new CreateReport()
