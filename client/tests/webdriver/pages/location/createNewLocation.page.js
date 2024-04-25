import Page from "../page"

const PAGE_URL = "/locations/new"

class CreateNewLocation extends Page {
  async getForm() {
    return browser.$(".form-horizontal")
  }

  async getCreateButton() {
    return browser.$('//button[contains(text(),"Save Location")]')
  }

  async getNameRequiredError() {
    return browser.$('//div[contains(text(),"name is a required field")]')
  }

  async getDescriptionInput() {
    return browser.$("#fg-description .editable")
  }

  async getNameField() {
    return (await this.getForm()).$("input#name")
  }

  async getTypeRequiredError() {
    return browser.$('//div[contains(text(),"type is a required field")]')
  }

  async getTypeField() {
    return (await this.getForm()).$("select.location-type-form-group")
  }

  async getDuplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  async getModalContent() {
    return browser.$("div.modal-content")
  }

  async getMaximiseLeafletButton() {
    return browser.$('//a[@role="button"][@aria-label="Full Screen"]')
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).$(".btn-close")
  }

  async getSimilarLocation() {
    return (await this.getModalContent()).$(
      ".modal-content tbody tr:first-child td:first-child a"
    )
  }

  async getLatField() {
    return (await this.getForm()).$("input#lat")
  }

  async getLngField() {
    return (await this.getForm()).$("input#lng")
  }

  async getAllFormatsPopover() {
    return (await this.getForm()).$("button#gloc-info-btn")
  }

  // parent of MGRS table data => tr
  async getAllFormatsPopoverLat() {
    return (await this.getForm())
      .$(".bp4-popover2-content table")
      .$("button*=Latitude")
      .$("..")
      .$("..")
      .$("span:first-child")
  }

  async getAllFormatsPopoverLng() {
    return (await this.getForm())
      .$(".bp4-popover2-content table")
      .$("button*=Latitude")
      .$("..")
      .$("..")
      .$("span:nth-child(3)")
  }

  async getAllFormatsPopoverMGRS() {
    // parent of MGRS table data => tr
    return (await this.getForm())
      .$(".bp4-popover2-content table")
      .$("button*=MGRS")
      .$("..")
      .$("..")
      .$("span:first-child")
  }

  async getSuccessMsg() {
    return browser.$('//div[text()="Location saved"]')
  }

  async latLngErrorsDisplayed() {
    const latError = await browser.$(
      '//div[contains(text(), "Latitude must be")]'
    )
    const lngError = await browser.$(
      '//div[contains(text(), "Longitude must be")]'
    )
    await latError.waitForExist()
    await lngError.waitForExist()
    await latError.waitForDisplayed()
    await lngError.waitForDisplayed()
  }

  async open() {
    await super.openAsAdminUser(PAGE_URL)
    await this.waitForPageToLoad()
  }

  async waitForPageToLoad() {
    await (await this.getForm()).waitForExist()
    await (await this.getForm()).waitForDisplayed()
  }

  async fillLocationDescription(description) {
    await (await this.getDescriptionInput()).click()
    await browser.keys(description)
    await browser.pause(300)
  }
}

export default new CreateNewLocation()
