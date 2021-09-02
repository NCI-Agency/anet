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
    return browser.$('//div[contains(text(),"name is a required field")]')
  }

  get nameField() {
    return this.form.$("input#name")
  }

  get typeRequiredError() {
    return browser.$('//div[contains(text(),"type is a required field")]')
  }

  get typeField() {
    return this.form.$("select.location-type-form-group")
  }

  get duplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  get modalContent() {
    return browser.$("div.modal-content")
  }

  get modalCloseButton() {
    return this.modalContent.$(".btn-close")
  }

  get similarLocation() {
    return this.modalContent.$(
      ".modal-content tbody tr:first-child td:first-child a"
    )
  }

  get latField() {
    return this.form.$("input#lat")
  }

  get lngField() {
    return this.form.$("input#lng")
  }

  get allFormatsPopover() {
    return this.form.$("button#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  get allFormatsPopoverLat() {
    return this.form
      .$(".bp3-popover2-content table")
      .$("td*=Latitude")
      .$("..")
      .$("span:first-child")
  }

  get allFormatsPopoverLng() {
    return this.form
      .$(".bp3-popover2-content table")
      .$("td*=Latitude")
      .$("..")
      .$("span:nth-child(3)")
  }

  get allFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return this.form
      .$(".bp3-popover2-content table")
      .$("td*=MGRS")
      .$("..")
      .$("span:first-child")
  }

  get successMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  latLngErrorsDisplayed() {
    const latError = browser.$('//div[contains(text(), "Latitude must be")]')
    const lngError = browser.$('//div[contains(text(), "Longitude must be")]')
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
