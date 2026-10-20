import { currentPage, typeKeys, waitFor } from "../../support.js"
import Page from "../page.js"

const PAGE_URL = "/locations/new"

class CreateNewLocation extends Page {
  async getForm() {
    return currentPage().locator(".form-horizontal").first()
  }

  async getCreateButton() {
    return currentPage()
      .locator('//button[contains(text(),"Save Location")]')
      .first()
  }

  async getNameRequiredError() {
    return currentPage()
      .locator('//div[contains(text(),"name is a required field")]')
      .first()
  }

  async getDescriptionInput() {
    return currentPage().locator("#fg-description .editable").first()
  }

  async getNameField() {
    return (await this.getForm()).locator("input#name").first()
  }

  async getTypeRequiredError() {
    return currentPage()
      .locator('//div[contains(text(),"type is a required field")]')
      .first()
  }

  async getTypeField() {
    return (await this.getForm())
      .locator("select.location-type-form-group")
      .first()
  }

  async getDuplicatesButton() {
    return currentPage()
      .locator('//button[text()="Possible Duplicates"]')
      .first()
  }

  async getModalContent() {
    return currentPage().locator("div.modal-content").first()
  }

  async getMaximiseLeafletButton() {
    return currentPage()
      .locator('//a[@role="button"][@aria-label="Full Screen"]')
      .first()
  }

  async getMinimiseLeafletButton() {
    return currentPage()
      .locator('//a[@role="button"][@aria-label="Exit Full Screen"]')
      .first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator(".btn-close").first()
  }

  async getSimilarLocation() {
    return (await this.getModalContent())
      .locator("tbody tr:first-child td:first-child a")
      .first()
  }

  async getLatField() {
    return (await this.getForm()).locator("input#lat").first()
  }

  async getLngField() {
    return (await this.getForm()).locator("input#lng").first()
  }

  async getAllFormatsPopover() {
    return (await this.getForm()).locator("button#gloc-info-btn").first()
  }

  // parent of MGRS table data => tr
  async getAllFormatsPopoverLat() {
    return (await this.getForm())
      .locator(".bp6-popover-content table")
      .first()
      .getByRole("button", {
        name: "Latitude",
        exact: false
      })
      .first()
      .locator("..")
      .locator("..")
      .locator("span:first-child")
      .first()
  }

  async getAllFormatsPopoverLng() {
    return (await this.getForm())
      .locator(".bp6-popover-content table")
      .first()
      .getByRole("button", {
        name: "Latitude",
        exact: false
      })
      .first()
      .locator("..")
      .locator("..")
      .locator("span:nth-child(3)")
      .first()
  }

  async getAllFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return (await this.getForm())
      .locator(".bp6-popover-content table")
      .first()
      .getByRole("button", {
        name: "MGRS",
        exact: false
      })
      .first()
      .locator("..")
      .locator("..")
      .locator("span:first-child")
      .first()
  }

  async getSuccessMsg() {
    return currentPage().locator('//div[text()="Location saved"]').first()
  }

  async latLngErrorsDisplayed() {
    const latError = await currentPage()
      .locator('//div[contains(text(), "Latitude must be")]')
      .first()
    const lngError = await currentPage()
      .locator('//div[contains(text(), "Longitude must be")]')
      .first()
    await waitFor(latError, "attached")
    await waitFor(lngError, "attached")
    await waitFor(latError, "visible")
    await waitFor(lngError, "visible")
  }

  async open() {
    await super.openAsAdminUser(PAGE_URL)
    await this.waitForPageToLoad()
  }

  async waitForPageToLoad() {
    await waitFor(await this.getForm(), "attached")
    await waitFor(await this.getForm(), "visible")
  }

  async fillLocationDescription(description) {
    await (await this.getDescriptionInput()).click()
    await typeKeys(description)
  }
}

export default new CreateNewLocation()
