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

  async getApp6contextInput() {
    return browser.$("#app6context")
  }

  async getApp6contextExtraColumn() {
    return browser.$("#fg-app6context div.col-sm-3")
  }

  async getApp6standardIdentityInput() {
    return browser.$("#app6standardIdentity")
  }

  async getApp6standardIdentityExtraColumn() {
    return browser.$("#fg-app6standardIdentity div.col-sm-3")
  }

  async getApp6symbolSetInput() {
    return browser.$("#app6symbolSet")
  }

  async getApp6symbolSetExtraColumn() {
    return browser.$("#fg-app6symbolSet div.col-sm-3")
  }

  async getApp6hqInput() {
    return browser.$("#app6hq")
  }

  async getApp6hqExtraColumn() {
    return browser.$("#fg-app6hq div.col-sm-3")
  }

  async getApp6amplifierInput() {
    return browser.$("#app6amplifier")
  }

  async getApp6amplifierExtraColumn() {
    return browser.$("#fg-app6amplifier div.col-sm-3")
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

  async fillOrganization(org, skipApp6Fields) {
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
    if (!skipApp6Fields) {
      await (
        await this.getApp6contextInput()
      ).selectByAttribute("value", org.app6contextInput)
      await (
        await this.getApp6standardIdentityInput()
      ).selectByAttribute("value", org.app6standardIdentityInput)
      await (
        await this.getApp6symbolSetInput()
      ).selectByAttribute("value", org.app6symbolSetInput)
      await (
        await this.getApp6hqInput()
      ).selectByAttribute("value", org.app6hqInput)
      await (
        await this.getApp6amplifierInput()
      ).selectByAttribute("value", org.app6amplifierInput)
    }
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
