import { expect } from "@playwright/test"
import { currentPage, typeKeys, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/organizations/new"

class CreateOrganization extends Page {
  async getForm() {
    return currentPage().locator("form.form-horizontal").first()
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async getOrganizationShortNameHelpBlock() {
    return currentPage().locator("#fg-shortName div.invalid-feedback").first()
  }

  async getShortNameInput() {
    return currentPage().locator("#shortName").first()
  }

  async getLongNameInput() {
    return currentPage().locator("#longName").first()
  }

  async getParentOrganizationInput() {
    return currentPage().locator("#parentOrg").first()
  }

  async getClearParentOrganizationButton() {
    return currentPage().locator("#fg-parentOrg div.input-group button").first()
  }

  async getParentOrganizationSearchPopover() {
    return currentPage().locator("#parentOrg-popover").first()
  }

  async getParentOrganizationsTable() {
    return (await this.getParentOrganizationSearchPopover())
      .locator(".table-responsive table")
      .first()
  }

  async selectParentOrganizationByText(name, expectedName = name) {
    await (await this.getParentOrganizationInput()).click()
    // wait for parentOrg table loader to disappear
    await waitFor(await this.getParentOrganizationsTable(), "visible")
    await (await this.getParentOrganizationInput()).fill(String(name))
    const table = await this.getParentOrganizationsTable()
    const rows = table.locator("tbody tr")
    const matchingRow = rows.filter({
      hasText: expectedName
    })
    const radioButton = matchingRow.first().locator("input.form-check-input")
    if (!(await radioButton.isChecked())) {
      await radioButton.click()
    }
    await (await this.getShortNameInput()).click()
    await waitFor(await this.getParentOrganizationSearchPopover(), "attached", {
      reverse: true,
      timeout: 3000
    })
  }

  async getLocationInput() {
    return currentPage().locator("#location").first()
  }

  async getLocationAdvancedSelectItem(rowNumber = 2) {
    return currentPage()
      .locator(
        `#location-popover tbody tr:nth-child(${rowNumber}) td:nth-child(2) span`
      )
      .first()
  }

  async getProfileInput() {
    return currentPage().locator("#fg-profile .editable").first()
  }

  async openEditApp6Modal() {
    const editApp6Button = currentPage().locator("#edit-app6-button").first()
    await editApp6Button.click()
    // wait for the modal to render
  }

  async closeEditApp6Modal() {
    const applyButton = await currentPage()
      .locator('//button[text()="Apply"]')
      .first()
    await applyButton.click()
    await waitFor(await applyButton, "attached", {
      reverse: true,
      timeout: 3000
    })
  }

  async getApp6DropdownSelection(field) {
    const inputButton = await currentPage()
      .locator(`#${field}-dropdown`)
      .first()
    const inputValue = await inputButton.locator("div:nth-child(2)").first()
    await waitFor(inputValue, "attached")
    return inputValue
  }

  async setApp6DropdownValue(field, value) {
    const inputButton = await currentPage()
      .locator(`#${field}-dropdown`)
      .first()
    await inputButton.click()
    const dropdownMenu = await currentPage()
      .locator(".dropdown-menu.show")
      .first()
    await waitFor(dropdownMenu, "visible")
    const matchingItem = await dropdownMenu
      .locator(`[data-key="${value}"]`)
      .first()
    await matchingItem.click()
    await waitFor(await dropdownMenu, "attached", {
      reverse: true,
      timeout: 3000
    })
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
    await (await this.getShortNameInput()).fill(String(org.shortName))
    await (await this.getLongNameInput()).fill(String(org.description))
    await (await this.getLocationInput()).click()
    await (await this.getLocationInput()).fill(String(org.location))
    await this.waitForLocationAdvancedSelectToChange(org.location)
    await expect(await this.getLocationAdvancedSelectItem()).toContainText(
      org.location,
      { useInnerText: true }
    )
    await (await this.getLocationAdvancedSelectItem()).click()
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
    if (org.app6entity) {
      await this.setApp6DropdownValue("app6entity", org.app6entityInput)
    }
    if (org.app6entityType) {
      await this.setApp6DropdownValue("app6entityType", org.app6entityTypeInput)
    }
    if (org.app6entitySubtype) {
      await this.setApp6DropdownValue(
        "app6entitySubtype",
        org.app6entitySubtypeInput
      )
    }
    if (org.app6sectorOneModifier) {
      await this.setApp6DropdownValue(
        "app6sectorOneModifier",
        org.app6sectorOneModifierInput
      )
    }
    if (org.app6sectorTwoModifier) {
      await this.setApp6DropdownValue(
        "app6sectorTwoModifier",
        org.app6sectorTwoModifierInput
      )
    }
    await this.closeEditApp6Modal()
  }

  async waitForLocationAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getLocationAdvancedSelectItem,
      value
    )
  }

  async fillOrganizationProfile(profile) {
    await (await this.getProfileInput()).click()
    await typeKeys(profile)
  }
}

export default new CreateOrganization()
