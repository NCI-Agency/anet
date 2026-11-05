import Page from "../page.js"

const PAGE_URL = "/locations/new"
class CreateNewLocation extends Page {
  async getForm() {
    return this.page.locator(".form-horizontal").first()
  }

  async getCreateButton() {
    return this.page
      .getByRole("button", { name: "Save Location", exact: false })
      .first()
  }

  async getNameRequiredError() {
    return this.page
      .getByText("name is a required field", { exact: false })
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
      .getByText("type is a required field", { exact: false })
      .first()
  }

  async getTypeField() {
    return (await this.getForm())
      .locator("select.location-type-form-group")
      .first()
  }

  async getDuplicatesButton() {
    return this.page
      .getByRole("button", { name: "Possible Duplicates", exact: true })
      .first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
  }

  async getMaximiseLeafletButton() {
    return this.page
      .getByRole("button", { name: "Full Screen", exact: true })
      .first()
  }

  async getMinimiseLeafletButton() {
    return this.page
      .getByRole("button", { name: "Exit Full Screen", exact: true })
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

  // Scope format values to the row containing its copy button.
  async getAllFormatsPopoverLat() {
    return (await this.getForm())
      .locator(".bp6-popover-content table")
      .first()
      .getByRole("row")
      .filter({
        has: this.page.getByRole("button", { name: "Latitude" })
      })
      .first()
      .locator("span:first-child")
      .first()
  }

  async getAllFormatsPopoverLng() {
    return (await this.getForm())
      .locator(".bp6-popover-content table")
      .first()
      .getByRole("row")
      .filter({
        has: this.page.getByRole("button", { name: "Latitude" })
      })
      .first()
      .locator("span:nth-child(3)")
      .first()
  }

  async getAllFormatsPopoverMGRS() {
    // Scope format values to the row containing its copy button.
    return (await this.getForm())
      .locator(".bp6-popover-content table")
      .first()
      .getByRole("row")
      .filter({
        has: this.page.getByRole("button", { name: "MGRS" })
      })
      .first()
      .locator("span:first-child")
      .first()
  }

  async getSuccessMsg() {
    return this.page.getByText("Location saved", { exact: true }).first()
  }

  async latLngErrorsDisplayed() {
    const latError = await this.page
      .getByText("Latitude must be", { exact: false })
      .first()
    const lngError = await this.page
      .getByText("Longitude must be", { exact: false })
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
