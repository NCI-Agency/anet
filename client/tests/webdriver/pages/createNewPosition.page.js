import Page from "./page"

const PAGE_URL = "/positions/new"
class CreatePosition extends Page {
  async getForm() {
    return browser.$("form")
  }

  async getPositionNameInput() {
    return browser.$("#name")
  }

  async getDuplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  async getModalContent() {
    return browser.$("div.modal-content")
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).$("button.btn-close")
  }

  async getSimilarPosition() {
    return (await this.getModalContent()).$(
      "tbody tr:first-child td:first-child a"
    )
  }

  async getPositionNameHelpBlock() {
    return browser.$("#fg-name div.invalid-feedback")
  }

  async getTypeAdvisorButton() {
    return browser.$('label[for="type_ADVISOR"]')
  }

  async getTypePrincipalButton() {
    return browser.$('label[for="type_PRINCIPAL"]')
  }

  async getRoleMemberButton() {
    return browser.$('label[for="role_MEMBER"]')
  }

  async getRoleMemberInput() {
    return browser.$('input[id="role_MEMBER"]')
  }

  async getRoleDeputyButton() {
    return browser.$('label[for="role_DEPUTY"]')
  }

  async getRoleDeputyInput() {
    return browser.$('input[id="role_DEPUTY"]')
  }

  async getRoleLeaderButton() {
    return browser.$('label[for="role_LEADER"]')
  }

  async getRoleLeaderInput() {
    return browser.$('input[id="role_LEADER"]')
  }

  async getOrganizationInput() {
    return browser.$("#organization")
  }

  async getOrganizationHelpBlock() {
    return browser.$("#fg-organization div.invalid-feedback")
  }

  async getOrgAdvancedSelectFirstItem() {
    return browser.$(
      "#organization-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getLocationInput() {
    return browser.$("#location")
  }

  async getLocationHelpBlock() {
    return browser.$("#fg-location div.invalid-feedback")
  }

  async getLocAdvancedSelectFirstItem() {
    return browser.$(
      "#location-popover tbody tr:first-child td:nth-child(2) span"
    )
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getCancelButton() {
    return (await browser.$("div.submit-buttons")).$("button=Cancel")
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

  async waitForOrgAdvancedSelectToChange(value) {
    await (await this.getOrgAdvancedSelectFirstItem()).waitForExist()
    return browser.waitUntil(
      async() => {
        return (
          (await (await this.getOrgAdvancedSelectFirstItem()).getText()) ===
          value
        )
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected org advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}

export default new CreatePosition()
