import Page from "../page"

const PAGE_URL = "/locations/:uuid/edit"

class EditLocation extends Page {
  getSaveLocationButton() {
    return browser.$('//button[text()="Save Location"]')
  }

  getLocationTypeLabel() {
    return browser.$("label*=Type")
  }

  getLatLngLabel() {
    return browser.$("label*=Latitude")
  }

  // Can't edit anet.yml to change location format, so can't test this for now
  getMgrsLabel() {
    return browser.$("label*=MGRS")
  }

  getAllFormatsPopover() {
    return browser.$("button#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  getAllFormatsPopoverLat() {
    return browser
      .$(".bp4-popover2-content table")
      .$("td*=Latitude")
      .$("..")
      .$("span:first-child")
  }

  getAllFormatsPopoverLng() {
    return browser
      .$(".bp4-popover2-content table")
      .$("td*=Latitude")
      .$("..")
      .$("span:nth-child(3)")
  }

  getAllFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return browser
      .$(".bp4-popover2-content table")
      .$("td*=MGRS")
      .$("..")
      .$("span:first-child")
  }

  getLocationTypeField() {
    return browser.$("select.location-type-form-group")
  }

  getLatInputField() {
    return browser.$("input#lat")
  }

  getLngInputField() {
    return browser.$("input#lng")
  }

  open(locationId) {
    super.open(PAGE_URL.replace(":uuid", locationId))
    this.waitForEditLocationPageToLoad()
  }

  waitForEditLocationPageToLoad() {
    if (!this.getSaveLocationButton().isDisplayed()) {
      this.getSaveLocationButton().waitForExist()
      this.getSaveLocationButton().waitForDisplayed()
    }
  }
}

export default new EditLocation()
