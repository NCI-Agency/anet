import Page from "../page.js"

const PAGE_URL = "/locations/:uuid/edit"

class EditLocation extends Page {
  async getSaveLocationButton() {
    return this.page
      .getByRole("button", { name: "Save Location", exact: true })
      .first()
  }

  async getLocationTypeLabel() {
    return this.page
      .getByText("Type", {
        exact: false
      })
      .first()
  }

  async getLatLngLabel() {
    return this.page
      .getByText("Latitude", {
        exact: false
      })
      .first()
  }

  // Can't edit dictionary to change location format, so can't test this for now
  async getMgrsLabel() {
    return this.page
      .getByText("MGRS", {
        exact: false
      })
      .first()
  }

  async getAllFormatsPopover() {
    return this.page.locator("button#gloc-info-btn").first()
  }

  // Scope format values to the row containing its copy button.
  async getAllFormatsPopoverLat() {
    return this.page
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
    return this.page
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
    return this.page
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

  async getLocationTypeField() {
    return this.page.locator("select.location-type-form-group").first()
  }

  async getLatInputField() {
    return this.page.locator("input#lat").first()
  }

  async getLngInputField() {
    return this.page.locator("input#lng").first()
  }

  async open(locationId) {
    await super.open(PAGE_URL.replace(":uuid", locationId))
    await this.waitForEditLocationPageToLoad()
  }

  async waitForEditLocationPageToLoad() {
    if (!(await (await this.getSaveLocationButton()).isVisible())) {
      await (
        await this.getSaveLocationButton()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    }
  }
}

export default EditLocation
