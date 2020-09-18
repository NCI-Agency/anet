import Page from "../page"

const PAGE_URL = "/locations/"

class EditLocation extends Page {
  get saveLocationButton() {
    return browser.$('//button[text()="Save Location"]')
  }

  get latLngLabel() {
    return browser.$("label*=Latitude")
  }

  // Can't edit anet.yml to change location format, so can't test this for now
  get mgrsLabel() {
    return browser.$("label*=MGRS")
  }

  get allFormatsPopover() {
    return browser.$("a#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  get allFormatsPopoverLatLng() {
    return browser.$(".bp3-popover-content table").$("td*=Latitude").$("..")
  }

  get allFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return browser.$(".bp3-popover-content table").$("td*=MGRS").$("..")
  }

  get latInputField() {
    return browser.$("input#lat")
  }

  get lngInputField() {
    return browser.$("input#lng")
  }

  open(locationId) {
    super.open(PAGE_URL + locationId + "/edit")
    this.waitForEditLocationPageToLoad()
  }

  waitForEditLocationPageToLoad() {
    if (!this.saveLocationButton.isDisplayed()) {
      this.saveLocationButton.waitForExist()
      this.saveLocationButton.waitForDisplayed()
    }
  }
}

export default new EditLocation()
