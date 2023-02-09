import { expect } from "chai"
import CreateNewLocation from "../pages/location/createNewLocation.page"
import {
  BAD_LAT_LNG_VAL,
  LOCATION_COORDS,
  LOCATION_NAME,
  LOCATION_TYPE,
  SIMILAR_LOCATION
} from "./locationUtils"

const SHORT_WAIT_MS = 1000

describe("When creating a new Location", () => {
  it("Should not create a location without name & type input", () => {
    CreateNewLocation.open()
    CreateNewLocation.getCreateButton().click()
    CreateNewLocation.getNameRequiredError().waitForExist()
    CreateNewLocation.getNameRequiredError().waitForDisplayed()
    CreateNewLocation.getTypeRequiredError().waitForExist()
    CreateNewLocation.getTypeRequiredError().waitForDisplayed()
  })

  it("Should display possible duplicates with similar names", () => {
    CreateNewLocation.getNameField().setValue(SIMILAR_LOCATION.name)
    CreateNewLocation.getTypeField().selectByIndex(LOCATION_TYPE.index)
    CreateNewLocation.getDuplicatesButton().waitForDisplayed()
    CreateNewLocation.getDuplicatesButton().click()
    browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
    CreateNewLocation.getModalContent().waitForDisplayed()
    const similar = CreateNewLocation.getSimilarLocation().getText()
    CreateNewLocation.getModalCloseButton().waitForDisplayed()
    CreateNewLocation.getModalCloseButton().click()
    browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
    CreateNewLocation.getModalContent().waitForDisplayed({ reverse: true })
    expect(similar).to.equal("Kabul Hospital")
  })

  it("Should not accept invalid latitude-longitude inputs", () => {
    CreateNewLocation.getNameField().setValue(LOCATION_NAME)
    CreateNewLocation.getLatField().setValue(BAD_LAT_LNG_VAL)
    CreateNewLocation.getLngField().setValue(BAD_LAT_LNG_VAL)
    // trigger onblur effect
    CreateNewLocation.getNameField().click()

    CreateNewLocation.latLngErrorsDisplayed()
  })

  it("Should have a location with correct MGRS in popover", () => {
    CreateNewLocation.deleteInput(CreateNewLocation.getLatField())
    CreateNewLocation.getLatField().setValue(LOCATION_COORDS.lat)
    CreateNewLocation.deleteInput(CreateNewLocation.getLngField())
    CreateNewLocation.getLngField().setValue(LOCATION_COORDS.lng)
    // trigger onblur effect
    CreateNewLocation.getNameField().click()
    CreateNewLocation.getAllFormatsPopover().click()
    CreateNewLocation.getAllFormatsPopoverLat().waitForExist()
    CreateNewLocation.getAllFormatsPopoverMGRS().waitForExist()

    expect(CreateNewLocation.getAllFormatsPopoverLat().getText()).to.equal(
      LOCATION_COORDS.lat
    )

    expect(CreateNewLocation.getAllFormatsPopoverLng().getText()).to.equal(
      LOCATION_COORDS.lng
    )

    expect(CreateNewLocation.getAllFormatsPopoverMGRS().getText()).to.equal(
      LOCATION_COORDS.mgrs
    )
  })

  it("Should create a location successfully", () => {
    CreateNewLocation.getCreateButton().click()
    CreateNewLocation.getSuccessMsg().waitForExist()
    CreateNewLocation.getSuccessMsg().waitForDisplayed()
  })
})
