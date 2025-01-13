import Page from "./page"

const PAGE_URL = "/events/new"
class CreateEvent extends Page {
  async getForm() {
    return browser.$("form.form-horizontal")
  }

  async getNameInput() {
    return (await this.getForm()).$("#name")
  }

  async getNameHelpBlock() {
    return browser.$("#fg-name div.invalid-feedback")
  }

  async getTypeInput() {
    return (await this.getForm()).$("#type")
  }

  async getTypeHelpBlock() {
    return browser.$("#fg-type div.invalid-feedback")
  }

  async getHostOrganizationInput() {
    return browser.$("#hostOrg")
  }

  async getHostOrgHelpBlock() {
    return browser.$("#fg-hostOrg div.invalid-feedback")
  }

  async getAdminOrganizationInput() {
    return browser.$("#adminOrg")
  }

  async getAdminOrgAdvancedSelectFirstItem() {
    return browser.$(
      "#adminOrg-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getHostOrgAdvancedSelectFirstItem() {
    return browser.$(
      "#hostOrg-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async open() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async waitForHostOrgAdvancedSelectToChange(value) {
    await (await this.getHostOrgAdvancedSelectFirstItem()).waitForExist()
    return browser.waitUntil(
      async() => {
        return (
          (await (await this.getHostOrgAdvancedSelectFirstItem()).getText()) ===
          value
        )
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected host org advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  async waitForAdminOrgAdvancedSelectToChange(value) {
    await (await this.getAdminOrgAdvancedSelectFirstItem()).waitForExist()
    return browser.waitUntil(
      async() => {
        return (
          (await (
            await this.getAdminOrgAdvancedSelectFirstItem()
          ).getText()) === value
        )
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected admin org advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }

  async getStartDateInput() {
    return browser.$("#startDate")
  }

  async getStartDateHelpBlock() {
    return browser.$("#fg-startDate div.invalid-feedback")
  }

  async getEndDateInput() {
    return browser.$("#endDate")
  }

  async getEndDateHelpBlock() {
    return browser.$("#fg-endDate div.invalid-feedback")
  }
}

export default new CreateEvent()
