import Page from "../page"

const PAGE_URL = "/locations/new"

class CreateNewLocation extends Page {
  get form() {
    return browser.$(".form-horizontal")
  }

  get createButton() {
    return browser.$('//button[contains(text(),"Save Location")]')
  }

  get nameRequiredError() {
    return browser.$('//span[contains(text(),"name is a required field")]')
  }

  get nameField() {
    return this.form.$("input#name")
  }

  get latField() {
    return this.form.$("input#lat")
  }

  get lngField() {
    return this.form.$("input#lng")
  }

  get allFormatsPopover() {
    return this.form.$("a#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  get allFormatsPopoverLatLng() {
    return this.form.$(".bp3-popover-content table").$("td*=Latitude").$("..")
  }

  get allFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return this.form.$(".bp3-popover-content table").$("td*=MGRS").$("..")
  }

  get successMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  latLngErrorsDisplayed() {
    const latError = browser.$('//span[contains(text(), "Latitude must be")]')
    const lngError = browser.$('//span[contains(text(), "Longitude must be")]')
    latError.waitForExist()
    lngError.waitForExist()
    latError.waitForDisplayed()
    lngError.waitForDisplayed()
  }

  open() {
    super.openAsAdminUser(PAGE_URL)
    this.waitForPageToLoad()
  }

  waitForPageToLoad() {
    this.form.waitForExist()
    this.form.waitForDisplayed()
  }
}

export default new CreateNewLocation()
