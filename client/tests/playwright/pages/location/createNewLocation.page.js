import Page from "../page.js"

const PAGE_URL = "/locations/new"
class CreateNewLocation extends Page {
  async getForm() {
    return this.page.locator(".form-horizontal").first()
  }

  async getCreateButton() {
    return this.page
      .locator('//button[contains(text(),"Save Location")]')
      .first()
  }

  async getNameRequiredError() {
    return this.page
      .locator('//div[contains(text(),"name is a required field")]')
      .first()
  }

  async getDescriptionInput() {
    return this.page.locator("#fg-description .editable").first()
  }

  async getNameField() {
    return (await this.getForm()).locator("input#name").first()
  }

  async getTypeRequiredError() {
    return this.page
      .locator('//div[contains(text(),"type is a required field")]')
      .first()
  }

  async getTypeField() {
    return (await this.getForm())
      .locator("select.location-type-form-group")
      .first()
  }

  async getDuplicatesButton() {
    return this.page.locator('//button[text()="Possible Duplicates"]').first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
  }

  async getMaximiseLeafletButton() {
    return this.page
      .locator('//a[@role="button"][@aria-label="Full Screen"]')
      .first()
  }

  async getMinimiseLeafletButton() {
    return this.page
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
    return this.page.locator('//div[text()="Location saved"]').first()
  }

  async latLngErrorsDisplayed() {
    const latError = await this.page
      .locator('//div[contains(text(), "Latitude must be")]')
      .first()
    const lngError = await this.page
      .locator('//div[contains(text(), "Longitude must be")]')
      .first()
    await latError.waitFor({
      state: "attached",
      timeout: 10000
    })
    await lngError.waitFor({
      state: "attached",
      timeout: 10000
    })
    await latError.waitFor({
      state: "visible",
      timeout: 10000
    })
    await lngError.waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async open() {
    await super.openAsAdminUser(PAGE_URL)
    await this.waitForPageToLoad()
  }

  async waitForPageToLoad() {
    await (
      await this.getForm()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async fillLocationDescription(description) {
    await (await this.getDescriptionInput()).click()
    await this.page.keyboard.insertText(String(description))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
  }
}
export default CreateNewLocation
