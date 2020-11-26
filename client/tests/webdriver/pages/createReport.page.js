import Page from "./page"

const PAGE_URL = "/reports/new"

const trfId = "formCustomFields.relatedReport"
const tmrfId = "formCustomFields.additionalEngagementNeeded"

export class CreateReport extends Page {
  get form() {
    return browser.$("form")
  }

  get alert() {
    return browser.$(".alert")
  }

  get engagementInformationTitle() {
    return browser.$('//span[text()="Engagement information"]')
  }

  get testReferenceFieldFormGroup() {
    return browser.$(`div[id="fg-${trfId}"]`)
  }

  get testReferenceFieldLabel() {
    return this.testReferenceFieldFormGroup.$(`label[for="${trfId}"]`)
  }

  get testReferenceFieldHelpText() {
    return this.testReferenceFieldFormGroup.$('span[class="help-block"]')
  }

  get testReferenceField() {
    return this.testReferenceFieldFormGroup.$(`input[id="${trfId}"]`)
  }

  get testReferenceFieldAdvancedSelectFirstItem() {
    return this.testReferenceFieldFormGroup.$(
      `div[id="${trfId}-popover"] tbody tr:first-child td:nth-child(2)`
    )
  }

  get testReferenceFieldValue() {
    return this.testReferenceFieldFormGroup.$(
      `table[id="${trfId}-value"] tbody tr:first-child`
    )
  }

  get testMultiReferenceFieldFormGroup() {
    return browser.$(`div[id="fg-${tmrfId}"]`)
  }

  get testMultiReferenceFieldLabel() {
    return this.testMultiReferenceFieldFormGroup.$(`label[for="${tmrfId}"]`)
  }

  get testMultiReferenceFieldHelpText() {
    return this.testMultiReferenceFieldFormGroup.$('span[class="help-block"]')
  }

  get testMultiReferenceField() {
    return this.testMultiReferenceFieldFormGroup.$(`input[id="${tmrfId}"]`)
  }

  get testMultiReferenceFieldAdvancedSelect() {
    return this.testMultiReferenceFieldFormGroup.$(
      `div[id="${tmrfId}-popover"] tbody`
    )
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
      `table[id="${tmrfId}-value"]`
    )
  }

  get testMultiReferenceFieldValueRows() {
    return this.testMultiReferenceFieldValue.$$("tbody tr")
  }

  getTestMultiReferenceFieldValueRow(n) {
    return this.testMultiReferenceFieldValue.$(`tbody tr:nth-child(${n})`)
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get editButton() {
    return browser.$('//a[text()="Edit"]')
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
    this.submitButton.click()
  }
}

export default new CreateReport()
