import Page from "./page"

const PAGE_URL = "/reports/new"

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
  getForm() {
    return browser.$("form")
  }

  getAlert() {
    return browser.$(".alert")
  }

  getDuration() {
    return browser.$("#duration")
  }

  getPositiveAtmosphere() {
    return browser.$('label[for="atmosphere_POSITIVE"]')
  }

  getCustomFieldFormGroup(id) {
    return browser.$(`div[id="fg-${id}"]`)
  }

  getEngagementInformationTitle() {
    return browser.$('//span[text()="Engagement information"]')
  }

  getTestReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(RELATED_REPORT_ID)
  }

  getTestReferenceFieldLabel() {
    return this.getTestReferenceFieldFormGroup().$(
      `label[for="${RELATED_REPORT_ID}"]`
    )
  }

  getTestReferenceFieldHelpText() {
    return this.getTestReferenceFieldFormGroup().$("div.form-text")
  }

  getTestReferenceField() {
    return this.getTestReferenceFieldFormGroup().$(
      `input[id="${RELATED_REPORT_ID}"]`
    )
  }

  getTestReferenceFieldAdvancedSelectFirstItem() {
    return this.getTestReferenceFieldFormGroup().$(
      `div[id="${RELATED_REPORT_ID}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  getTestReferenceFieldValue() {
    return this.getTestReferenceFieldFormGroup().$(
      `table[id="${RELATED_REPORT_ID}-value"] tbody tr:first-child`
    )
  }

  getTestMultiReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(ADDITIONAL_ENGAGEMENTS_ID)
  }

  getTestMultiReferenceFieldLabel() {
    return this.getTestMultiReferenceFieldFormGroup().$(
      `label[for="${ADDITIONAL_ENGAGEMENTS_ID}"]`
    )
  }

  getTestMultiReferenceFieldHelpText() {
    return this.getTestMultiReferenceFieldFormGroup().$("div.form-text")
  }

  getTestMultiReferenceField() {
    return this.getTestMultiReferenceFieldFormGroup().$(
      `input[id="${ADDITIONAL_ENGAGEMENTS_ID}"]`
    )
  }

  getTestMultiReferenceFieldAdvancedSelect() {
    return this.getTestMultiReferenceFieldFormGroup().$(
      `div[id="${ADDITIONAL_ENGAGEMENTS_ID}-popover"] tbody`
    )
  }

  getEngagementTypesFieldFormGroup() {
    return this.getCustomFieldFormGroup(ENGAGEMENT_TYPES_ID)
  }

  getEngagementTypesFieldLabel() {
    return this.getEngagementTypesFieldFormGroup().$(
      `label[for="${ENGAGEMENT_TYPES_ID}"]`
    )
  }

  getEngagementTypesButtonByName(name) {
    return this.getEngagementTypesFieldFormGroup().$(
      `label[for="formCustomFields.multipleButtons_${name}"]`
    )
  }

  getFieldsToggledVisibilityByTrainButton() {
    return Object.keys(TRAINING_TOGGLED_FIELDS).map(fieldId => {
      return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS[fieldId])
    })
  }

  getFieldsNotToggledVisibilityByTrainButton() {
    return Object.keys(ADVISE_FIELDS)
      .map(fieldId => {
        return this.getCustomFieldFormGroup(ADVISE_FIELDS[fieldId])
      })
      .concat(
        // fieldsets are not prepended with fg-
        Object.keys(OTHER_FIELDS).map(fieldsetId => {
          return browser.$(`div[id="${OTHER_FIELDS[fieldsetId]}"]`)
        })
      )
  }

  getNumberTrainedFormGroup() {
    return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS.numberTrained)
  }

  getNumberTrainedField() {
    return this.getNumberTrainedFormGroup().$(
      `input[id="${TRAINING_TOGGLED_FIELDS.numberTrained}"]`
    )
  }

  getNumberTrainedFieldShowed() {
    return this.getNumberTrainedFormGroup().$("div.form-control-plaintext")
  }

  getNumberTrainedErrorText() {
    return this.getNumberTrainedFormGroup().$("div.invalid-feedback")
  }

  getTestMultiReferenceFieldAdvancedSelectItem(n) {
    return this.getTestMultiReferenceFieldAdvancedSelect().$(
      `tr:nth-child(${n}) td:nth-child(2)`
    )
  }

  getTestMultiReferenceFieldAdvancedSelectItemLabel(n) {
    return this.getTestMultiReferenceFieldAdvancedSelectItem(n).$("span")
  }

  getTestMultiReferenceFieldValue() {
    return this.getTestMultiReferenceFieldFormGroup().$(
      `table[id="${ADDITIONAL_ENGAGEMENTS_ID}-value"]`
    )
  }

  getTestMultiReferenceFieldValueRows() {
    return this.getTestMultiReferenceFieldValue().$$("tbody tr")
  }

  getTestMultiReferenceFieldValueRow(n) {
    return this.getTestMultiReferenceFieldValue().$(`tbody tr:nth-child(${n})`)
  }

  getAttendeesAssessments() {
    return browser.$("#attendees-engagement-assessments")
  }

  getAttendeeAssessmentRows() {
    return this.getAttendeesAssessments().$$("tr")
  }

  getAttendeeAssessment(name) {
    return this.getAttendeesAssessments().$(`//td/a[text()="${name}"]`)
  }

  getTasksAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  getTaskAssessmentRows() {
    return this.getTasksAssessments().$$("tr")
  }

  getTaskAssessment(shortName) {
    return this.getTasksAssessments().$(`//td/a[text()="${shortName}"]`)
  }

  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  getEditButton() {
    return browser.$('//a[text()="Edit"]')
  }

  getCancelButton() {
    return browser.$('//button[text()="Cancel"]')
  }

  getDeleteButton() {
    return browser.$('//button[text()="Delete this report"]')
  }

  getConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  open(pathName = PAGE_URL, credentials = Page.DEFAULT_CREDENTIALS.user) {
    super.open(pathName, credentials)
  }

  openAs(user) {
    super.open(PAGE_URL, user)
  }

  openAsAdminUser() {
    super.openAsAdminUser(PAGE_URL)
  }

  waitForAlertToLoad() {
    this.getAlert().waitForExist()
    this.getAlert().waitForDisplayed()
  }

  waitForAdvancedSelectToChange(item, value) {
    item.waitForExist()
    return browser.waitUntil(
      () => {
        return item.getText() === value
      },
      {
        timeout: 5000,
        timeoutMsg: `Expected advanced select input to contain "${value}" after 5s, but was "${item.getText()}"`
      }
    )
  }

  submitForm() {
    this.getSubmitButton().waitForClickable()
    this.getSubmitButton().click()
    this.getSubmitButton().waitForExist({ reverse: true })
  }
}

export default new CreateReport()
