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

  open(locationId) {
    console.log(PAGE_URL, typeof PAGE_URL)
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
