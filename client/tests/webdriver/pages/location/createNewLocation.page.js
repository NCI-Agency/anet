import Page from "../page"

const PAGE_URL = "/locations/new"

class CreateNewLocation extends Page {
  getForm() {
    return browser.$(".form-horizontal")
  }

  getCreateButton() {
    return browser.$('//button[contains(text(),"Save Location")]')
  }

  getNameRequiredError() {
    return browser.$('//div[contains(text(),"name is a required field")]')
  }

  getNameField() {
    return this.getForm().$("input#name")
  }

  getTypeRequiredError() {
    return browser.$('//div[contains(text(),"type is a required field")]')
  }

  getTypeField() {
    return this.getForm().$("select.location-type-form-group")
  }

  getDuplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  getModalContent() {
    return browser.$("div.modal-content")
  }

  getModalCloseButton() {
    return this.getModalContent().$(".btn-close")
  }

  getSimilarLocation() {
    return this.getModalContent().$(
      ".modal-content tbody tr:first-child td:first-child a"
    )
  }

  getLatField() {
    return this.getForm().$("input#lat")
  }

  getLngField() {
    return this.getForm().$("input#lng")
  }

  getAllFormatsPopover() {
    return this.getForm().$("button#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  getAllFormatsPopoverLat() {
    return this.getForm()
      .$(".bp4-popover2-content table")
      .$("td*=Latitude")
      .$("..")
      .$("span:first-child")
  }

  getAllFormatsPopoverLng() {
    return this.getForm()
      .$(".bp4-popover2-content table")
      .$("td*=Latitude")
      .$("..")
      .$("span:nth-child(3)")
  }

  getAllFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return this.getForm()
      .$(".bp4-popover2-content table")
      .$("td*=MGRS")
      .$("..")
      .$("span:first-child")
  }

  getSuccessMsg() {
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
    this.getForm().waitForExist()
    this.getForm().waitForDisplayed()
  }
}

export default new CreateNewLocation()
