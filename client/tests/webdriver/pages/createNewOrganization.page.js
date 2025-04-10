import { expect } from "chai"
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

  async getParentOrganizationInput() {
    return browser.$("#parentOrg")
  }

  async getClearParentOrganizationButton() {
    return browser.$("#fg-parentOrg div.input-group button")
  }

  async getParentOrganizationSearchPopover() {
    return browser.$("#parentOrg-popover")
  }

  async getParentOrganizationsTable() {
    return (await this.getParentOrganizationSearchPopover()).$(
      ".table-responsive table"
    )
  }

  async selectParentOrganizationByText(name) {
    await (await this.getParentOrganizationInput()).click()
    // wait for parentOrg table loader to disappear
    await (await this.getParentOrganizationsTable()).waitForDisplayed()
    await browser.keys(name)
    await (await this.getParentOrganizationsTable()).waitForDisplayed()
    await browser.pause(500) // wait for the rendering of the search results
    const radioButton = await (
      await this.getParentOrganizationsTable()
    ).$("tbody tr:first-child td:first-child input.form-check-input")
    if (!(await radioButton.isSelected())) {
      await radioButton.click()
    }
    await (await this.getShortNameInput()).click()
    await (
      await this.getParentOrganizationSearchPopover()
    ).waitForExist({ reverse: true, timeout: 3000 })
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

  async openEditApp6Modal() {
    const editApp6Button = browser.$("#edit-app6-button")
    await editApp6Button.click()
  }

  async closeEditApp6Modal() {
    const applyButton = await browser.$('//button[text()="Apply"]')
    await applyButton.click()
    await applyButton.waitForDisplayed({ reverse: true })
  }

  async getApp6DropdownValue(field) {
    const InputButton = await browser.$(`#${field}-dropdown`)
    return await (await InputButton.$("div:nth-child(2)")).getText()
  }

  async setApp6DropdownValue(field, value) {
    const InputButton = await browser.$(`#${field}-dropdown`)
    await InputButton.click()

    const dropdownMenu = await browser.$(".dropdown-menu.show")
    await dropdownMenu.waitForDisplayed()

    const matchingItem = await dropdownMenu.$(`[data-key="${value}"]`)
    await matchingItem.click()

    await dropdownMenu.waitForDisplayed({ reverse: true })
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

  async fillOrganization(org) {
    await (await this.getShortNameInput()).setValue(org.shortName)
    await (await this.getLongNameInput()).setValue(org.description)
    await (await this.getLocationInput()).click()
    await (await this.getLocationInput()).setValue(org.location)
    await this.waitForLocationAdvancedSelectToChange(org.location)
    expect(
      await (await this.getLocationAdvancedSelectFirstItem()).getText()
    ).to.include(org.location)
    await (await this.getLocationAdvancedSelectFirstItem()).click()
    await this.fillOrganizationProfile(org.profile)
    await this.openEditApp6Modal()
    if (org.app6contextInput) {
      await this.setApp6DropdownValue("app6context", org.app6contextInput)
    }
    if (org.app6standardIdentityInput) {
      await this.setApp6DropdownValue(
        "app6standardIdentity",
        org.app6standardIdentityInput
      )
    }
    if (org.app6symbolSetInput) {
      await this.setApp6DropdownValue("app6symbolSet", org.app6symbolSetInput)
    }
    if (org.app6hqInput) {
      await this.setApp6DropdownValue("app6hq", org.app6hqInput)
    }
    if (org.app6amplifierInput) {
      await this.setApp6DropdownValue("app6amplifier", org.app6amplifierInput)
    }
    await this.closeEditApp6Modal()
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
