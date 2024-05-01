import Page from "../page"

const PAGE_URL = "/locations/:uuid/edit"

class EditLocation extends Page {
  async getSaveLocationButton() {
    return browser.$('//button[text()="Save Location"]')
  }

  async getLocationTypeLabel() {
    return browser.$("label*=Type")
  }

  async getLatLngLabel() {
    return browser.$("label*=Latitude")
  }

  // Can't edit anet.yml to change location format, so can't test this for now
  async getMgrsLabel() {
    return browser.$("label*=MGRS")
  }

  async getAllFormatsPopover() {
    return browser.$("button#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  async getAllFormatsPopoverLat() {
    return browser
      .$(".bp5-popover-content table")
      .$("button*=Latitude")
      .$("..")
      .$("..")
      .$("span:first-child")
  }

  async getAllFormatsPopoverLng() {
    return browser
      .$(".bp5-popover-content table")
      .$("button*=Latitude")
      .$("..")
      .$("..")
      .$("span:nth-child(3)")
  }

  async getAllFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return browser
      .$(".bp5-popover-content table")
      .$("button*=MGRS")
      .$("..")
      .$("..")
      .$("span:first-child")
  }

  async getLocationTypeField() {
    return browser.$("select.location-type-form-group")
  }

  async getLatInputField() {
    return browser.$("input#lat")
  }

  async getLngInputField() {
    return browser.$("input#lng")
  }

  async open(locationId) {
    await super.open(PAGE_URL.replace(":uuid", locationId))
    await this.waitForEditLocationPageToLoad()
  }

  async waitForEditLocationPageToLoad() {
    if (!(await (await this.getSaveLocationButton()).isDisplayed())) {
      await (await this.getSaveLocationButton()).waitForExist()
      await (await this.getSaveLocationButton()).waitForDisplayed()
    }
  }
}

export default new EditLocation()
