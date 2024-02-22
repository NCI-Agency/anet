import Page from "./page"

const PAGE_URL = "/organizations/new"

class CreateOrganization extends Page {
  async getForm() {
    return browser.$("form.form-horizontal")
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getOrganizationShortNameHelpBlock() {
    return browser.$("#fg-shortName div.invalid-feedback")
  }

  async getShortNameInput() {
    return browser.$("#shortName")
  }

  async getLongNameInput() {
    return browser.$("#longName")
  }

  async getLocationInput() {
    return browser.$("#location")
  }

  async getLocationAdvancedSelectFirstItem() {
    return browser.$(
      "#location-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getProfileInput() {
    return browser.$("#fg-profile .editable")
  }

  async openAsSuperuser() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdmin() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }

  async waitForLocationAdvancedSelectToChange(value) {
    await (await this.getLocationAdvancedSelectFirstItem()).waitForExist()
    return browser.waitUntil(
      async() => {
        return (
          (await (
            await this.getLocationAdvancedSelectFirstItem()
          ).getText()) === value
        )
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

  async fillOrganizationProfile(profile) {
    await (await this.getProfileInput()).click()
    await browser.keys(profile)
    await browser.pause(300)
  }
}

export default new CreateOrganization()
