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
  get form() {
    return browser.$("form")
  }

  get alert() {
    return browser.$(".alert")
  }

  get duration() {
    return browser.$("#duration")
  }

  get positiveAtmosphere() {
    return browser.$("#positiveAtmos")
  }

  getCustomFieldFormGroup(id) {
    return browser.$(`div[id="fg-${id}"]`)
  }

  get engagementInformationTitle() {
    return browser.$('//span[text()="Engagement information"]')
  }

  get testReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(RELATED_REPORT_ID)
  }

  get testReferenceFieldLabel() {
    return this.testReferenceFieldFormGroup.$(
      `label[for="${RELATED_REPORT_ID}"]`
    )
  }

  get testReferenceFieldHelpText() {
    return this.testReferenceFieldFormGroup.$('span[class="help-block"]')
  }

  get testReferenceField() {
    return this.testReferenceFieldFormGroup.$(
      `input[id="${RELATED_REPORT_ID}"]`
    )
  }

  get testReferenceFieldAdvancedSelectFirstItem() {
    return this.testReferenceFieldFormGroup.$(
      `div[id="${RELATED_REPORT_ID}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  get testReferenceFieldValue() {
    return this.testReferenceFieldFormGroup.$(
      `table[id="${RELATED_REPORT_ID}-value"] tbody tr:first-child`
    )
  }

  get testMultiReferenceFieldFormGroup() {
    return this.getCustomFieldFormGroup(ADDITIONAL_ENGAGEMENTS_ID)
  }

  get testMultiReferenceFieldLabel() {
    return this.testMultiReferenceFieldFormGroup.$(
      `label[for="${ADDITIONAL_ENGAGEMENTS_ID}"]`
    )
  }

  get testMultiReferenceFieldHelpText() {
    return this.testMultiReferenceFieldFormGroup.$('span[class="help-block"]')
  }

  get testMultiReferenceField() {
    return this.testMultiReferenceFieldFormGroup.$(
      `input[id="${ADDITIONAL_ENGAGEMENTS_ID}"]`
    )
  }

  get testMultiReferenceFieldAdvancedSelect() {
    return this.testMultiReferenceFieldFormGroup.$(
      `div[id="${ADDITIONAL_ENGAGEMENTS_ID}-popover"] tbody`
    )
  }

  get engagementTypesFieldFormGroup() {
    return this.getCustomFieldFormGroup(ENGAGEMENT_TYPES_ID)
  }

  get engagementTypesFieldLabel() {
    return this.engagementTypesFieldFormGroup.$(
      `label[for="${ENGAGEMENT_TYPES_ID}"]`
    )
  }

  getEngagementTypesButtonByName(name) {
    return this.engagementTypesFieldFormGroup.$(`label[id="${name}"]`)
  }

  get fieldsToggledVisibilityByTrainButton() {
    return Object.keys(TRAINING_TOGGLED_FIELDS).map(fieldId => {
      return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS[fieldId])
    })
  }

  get fieldsNotToggledVisibilityByTrainButton() {
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

  get numberTrainedFormGroup() {
    return this.getCustomFieldFormGroup(TRAINING_TOGGLED_FIELDS.numberTrained)
  }

  get numberTrainedField() {
    return this.numberTrainedFormGroup.$(
      `input[id="${TRAINING_TOGGLED_FIELDS.numberTrained}"]`
    )
  }

  get numberTrainedFieldShowed() {
    return this.numberTrainedFormGroup.$("div.form-control-static")
  }

  get numberTrainedHelpText() {
    return this.numberTrainedFormGroup.$('span[class="help-block"]')
  }

  getTestMultiReferenceFieldAdvancedSelectItem(n) {
    return this.testMultiReferenceFieldAdvancedSelect.$(
      `tr:nth-child(${n}) td:nth-child(2)`
    )
  }

  getTestMultiReferenceFieldAdvancedSelectItemLabel(n) {
    return this.getTestMultiReferenceFieldAdvancedSelectItem(n).$("span")
  }

  get testMultiReferenceFieldValue() {
    return this.testMultiReferenceFieldFormGroup.$(
      `table[id="${ADDITIONAL_ENGAGEMENTS_ID}-value"]`
    )
  }

  get testMultiReferenceFieldValueRows() {
    return this.testMultiReferenceFieldValue.$$("tbody tr")
  }

  getTestMultiReferenceFieldValueRow(n) {
    return this.testMultiReferenceFieldValue.$(`tbody tr:nth-child(${n})`)
  }

  get attendeesAssessments() {
    return browser.$("#attendees-engagement-assessments")
  }

  get attendeeAssessmentRows() {
    return this.attendeesAssessments.$$("tr")
  }

  getAttendeeAssessment(name) {
    return this.attendeesAssessments.$(`//td/a[text()="${name}"]`)
  }

  get tasksAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  get taskAssessmentRows() {
    return this.tasksAssessments.$$("tr")
  }

  getTaskAssessment(shortName) {
    return this.tasksAssessments.$(`//td/a[text()="${shortName}"]`)
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get editButton() {
    return browser.$('//a[text()="Edit"]')
  }

  get cancelButton() {
    return browser.$('//button[text()="Cancel"]')
  }

  get deleteButton() {
    return browser.$('//button[text()="Delete this report"]')
  }

  get confirmButton() {
    return browser.$(
      '//button[contains(text(),"Yes, I am sure that I want to delete report")]'
    )
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
    this.alert.waitForExist()
    this.alert.waitForDisplayed()
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
    this.submitButton.waitForClickable()
    this.submitButton.click()
    this.submitButton.waitForExist({ reverse: true })
  }
}

export default new CreateReport()
