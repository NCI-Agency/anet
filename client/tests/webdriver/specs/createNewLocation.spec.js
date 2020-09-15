import { expect } from "chai"
import CreateNewLocation from "../pages/location/createNewLocation.page"
export const LOCATION_NAME = "Test Location Spot"
const BAD_LAT_LNG_VAL = "999"
export const LOCATION_COORDS = {
  lat: "39.89089",
  lng: "32.78224",
  mgrs: "36SVK8138315670"
}

describe("When creating a new Location", () => {
  it("Should not create a location without name input", () => {
    CreateNewLocation.open()
    CreateNewLocation.createButton.click()
    CreateNewLocation.nameRequiredError.waitForExist()
    CreateNewLocation.nameRequiredError.waitForDisplayed()
  })

  it("Should not accept invalid latitude-longitude inputs", () => {
    CreateNewLocation.nameField.setValue(LOCATION_NAME)
    CreateNewLocation.latField.setValue(BAD_LAT_LNG_VAL)
    CreateNewLocation.lngField.setValue(BAD_LAT_LNG_VAL)

    CreateNewLocation.latLngErrorsDisplayed()
  })

  it("Should have a location with correct MGRS in popover", () => {
    CreateNewLocation.latField.setValue(
      "\uE003".repeat(BAD_LAT_LNG_VAL.length) + LOCATION_COORDS.lat
    )
    CreateNewLocation.lngField.setValue(
      "\uE003".repeat(BAD_LAT_LNG_VAL.length) + LOCATION_COORDS.lng
    )
    CreateNewLocation.allFormatsPopover.click()
    CreateNewLocation.allFormatsPopoverLatLng.waitForExist()
    CreateNewLocation.allFormatsPopoverMGRS.waitForExist()

    expect(CreateNewLocation.allFormatsPopoverLatLng.getText()).match(
      new RegExp(LOCATION_COORDS.lat, "g")
    )
    expect(CreateNewLocation.allFormatsPopoverLatLng.getText()).match(
      new RegExp(LOCATION_COORDS.lng, "g")
    )
    expect(CreateNewLocation.allFormatsPopoverMGRS.getText()).match(
      new RegExp(LOCATION_COORDS.mgrs, "g")
    )
  })

  it("Should create a location successfully", () => {
    CreateNewLocation.createButton.click()
    CreateNewLocation.successMsg.waitForExist()
    CreateNewLocation.successMsg.waitForDisplayed()
  })
})
