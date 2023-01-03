import Page from "./page"

const PAGE_URL = "/organizations/new"

class CreateOrganization extends Page {
  get form() {
    return browser.$("form.form-horizontal")
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get organizationShortNameHelpBlock() {
    return browser.$("#fg-shortName div.invalid-feedback")
  }

  get typeAdvisorButton() {
    return browser.$('label[for="type_ADVISOR_ORG"]')
  }

  get shortNameInput() {
    return browser.$("#shortName")
  }

  get longNameInput() {
    return browser.$("#longName")
  }

  get locationInput() {
    return browser.$("#location")
  }

  get locationAdvancedSelectFirstItem() {
    return browser.$(
      "#location-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  get profileInput() {
    return browser.$("#fg-profile .editable")
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }

  submitForm() {
    this.submitButton.click()
  }

  waitForLocationAdvancedSelectToChange(value) {
    this.locationAdvancedSelectFirstItem.waitForExist()
    return browser.waitUntil(
      () => {
        return this.locationAdvancedSelectFirstItem.getText() === value
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected location advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  fillOrganizationProfile(profile) {
    this.profileInput.click()
    browser.keys(profile)
    browser.pause(300)
  }
}

export default new CreateOrganization()
