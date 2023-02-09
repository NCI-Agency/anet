import Page from "./page"

const PAGE_URL = "/organizations/new"

class CreateOrganization extends Page {
  getForm() {
    return browser.$("form.form-horizontal")
  }

  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  getOrganizationShortNameHelpBlock() {
    return browser.$("#fg-shortName div.invalid-feedback")
  }

  getTypeAdvisorButton() {
    return browser.$('label[for="type_ADVISOR_ORG"]')
  }

  getShortNameInput() {
    return browser.$("#shortName")
  }

  getLongNameInput() {
    return browser.$("#longName")
  }

  getLocationInput() {
    return browser.$("#location")
  }

  getLocationAdvancedSelectFirstItem() {
    return browser.$(
      "#location-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  getProfileInput() {
    return browser.$("#fg-profile .editable")
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }

  submitForm() {
    this.getSubmitButton().click()
  }

  waitForLocationAdvancedSelectToChange(value) {
    this.getLocationAdvancedSelectFirstItem().waitForExist()
    return browser.waitUntil(
      () => {
        return this.getLocationAdvancedSelectFirstItem().getText() === value
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
    this.getProfileInput().click()
    browser.keys(profile)
    browser.pause(300)
  }
}

export default new CreateOrganization()
