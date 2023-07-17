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
  it("Should not create a location without name & type input", async() => {
    await CreateNewLocation.open()
    await (await CreateNewLocation.getCreateButton()).click()
    await (await CreateNewLocation.getNameRequiredError()).waitForExist()
    await (await CreateNewLocation.getNameRequiredError()).waitForDisplayed()
    await (await CreateNewLocation.getTypeRequiredError()).waitForExist()
    await (await CreateNewLocation.getTypeRequiredError()).waitForDisplayed()
  })

  it("Should display possible duplicates with similar names", async() => {
    await (
      await CreateNewLocation.getNameField()
    ).setValue(SIMILAR_LOCATION.name)
    await (
      await CreateNewLocation.getTypeField()
    ).selectByIndex(LOCATION_TYPE.index)
    await (await CreateNewLocation.getDuplicatesButton()).waitForDisplayed()
    await (await CreateNewLocation.getDuplicatesButton()).click()
    await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
    await (await CreateNewLocation.getModalContent()).waitForDisplayed()
    const similar = await (
      await CreateNewLocation.getSimilarLocation()
    ).getText()
    await (await CreateNewLocation.getModalCloseButton()).waitForDisplayed()
    await (await CreateNewLocation.getModalCloseButton()).click()
    await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
    await (
      await CreateNewLocation.getModalContent()
    ).waitForDisplayed({ reverse: true })
    expect(similar).to.equal("Kabul Hospital")
  })

  it("Should not accept invalid latitude-longitude inputs", async() => {
    await (await CreateNewLocation.getNameField()).setValue(LOCATION_NAME)
    await (await CreateNewLocation.getLatField()).setValue(BAD_LAT_LNG_VAL)
    await (await CreateNewLocation.getLngField()).setValue(BAD_LAT_LNG_VAL)
    // trigger onblur effect
    await (await CreateNewLocation.getNameField()).click()

    await CreateNewLocation.latLngErrorsDisplayed()
  })

  it("Should have a location with correct MGRS in popover", async() => {
    await CreateNewLocation.deleteInput(CreateNewLocation.getLatField())
    await (await CreateNewLocation.getLatField()).setValue(LOCATION_COORDS.lat)
    await CreateNewLocation.deleteInput(CreateNewLocation.getLngField())
    await (await CreateNewLocation.getLngField()).setValue(LOCATION_COORDS.lng)
    // trigger onblur effect
    await (await CreateNewLocation.getNameField()).click()
    await (await CreateNewLocation.getAllFormatsPopover()).click()
    await (await CreateNewLocation.getAllFormatsPopoverLat()).waitForExist()
    await (await CreateNewLocation.getAllFormatsPopoverMGRS()).waitForExist()
    expect(
      await (await CreateNewLocation.getAllFormatsPopoverLat()).getText()
    ).to.equal(LOCATION_COORDS.lat)

    expect(
      await (await CreateNewLocation.getAllFormatsPopoverLng()).getText()
    ).to.equal(LOCATION_COORDS.lng)

    expect(
      await (await CreateNewLocation.getAllFormatsPopoverMGRS()).getText()
    ).to.equal(LOCATION_COORDS.mgrs)
  })

  it("Should create a location successfully", async() => {
    await (await CreateNewLocation.getCreateButton()).click()
    await (await CreateNewLocation.getSuccessMsg()).waitForExist()
    await (await CreateNewLocation.getSuccessMsg()).waitForDisplayed()
  })
})
