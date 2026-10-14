import { currentPage, waitFor } from "../../support.js"
import Page from "../page.js"

const PAGE_URL = "/locations/:uuid/edit"
class EditLocation extends Page {
  async getSaveLocationButton() {
    return currentPage().locator('//button[text()="Save Location"]').first()
  }

  async getLocationTypeLabel() {
    return currentPage()
      .getByText("Type", {
        exact: false
      })
      .first()
  }

  async getLatLngLabel() {
    return currentPage()
      .getByText("Latitude", {
        exact: false
      })
      .first()
  }

  // Can't edit dictionary to change location format, so can't test this for now
  async getMgrsLabel() {
    return currentPage()
      .getByText("MGRS", {
        exact: false
      })
      .first()
  }

  async getAllFormatsPopover() {
    return currentPage().locator("button#gloc-info-btn").first()
  }

  // parent of MGRS table data => tr
  async getAllFormatsPopoverLat() {
    return currentPage()
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
    return currentPage()
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
    return currentPage()
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

  async getLocationTypeField() {
    return currentPage().locator("select.location-type-form-group").first()
  }

  async getLatInputField() {
    return currentPage().locator("input#lat").first()
  }

  async getLngInputField() {
    return currentPage().locator("input#lng").first()
  }

  async open(locationId) {
    await super.open(PAGE_URL.replace(":uuid", locationId))
    await this.waitForEditLocationPageToLoad()
  }

  async waitForEditLocationPageToLoad() {
    if (!(await (await this.getSaveLocationButton()).isVisible())) {
      await waitFor(await this.getSaveLocationButton(), "attached")
      await waitFor(await this.getSaveLocationButton(), "visible")
    }
  }
}
export default new EditLocation()
