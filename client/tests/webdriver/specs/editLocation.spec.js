import CreateNewLocation from "../pages/location/createNewLocation.page"
import EditLocation from "../pages/location/editLocation.page"
import ShowLocation from "../pages/location/showLocation.page"
import { LOCATION_COORDS, LOCATION_NAME, NEW_COORDS } from "./locationUtils"

describe("When editing a location", () => {
  it("Should create a new location first", () => {
    CreateNewLocation.open(LOCATION_NAME)
    CreateNewLocation.nameField.setValue(LOCATION_NAME)
    CreateNewLocation.latField.setValue(LOCATION_COORDS.lat)
    CreateNewLocation.lngField.setValue(LOCATION_COORDS.lng)
    CreateNewLocation.createButton.click()
    // We are sent to showLocation page
    ShowLocation.successMsg.waitForExist()
    ShowLocation.successMsg.waitForDisplayed()
  })

  it("Should see latitude and longitude label when selected format is LAT_LON", () => {
    ShowLocation.editButton.waitForExist()
    ShowLocation.editButton.waitForDisplayed()
    ShowLocation.editButton.click()
    // Now we are in the edit page
    EditLocation.latLngLabel.waitForExist()
    EditLocation.latLngLabel.waitForDisplayed()
  })

  it("Should correctly edit, display the correct values in both formats in the popover window", () => {
    const latInput = EditLocation.latInputField
    // can't use clear because of https://github.com/webdriverio/webdriverio/issues/4482#issuecomment-543332411
    // when using setValue shouldn't append but it does (https://github.com/webdriverio/webdriverio/issues/3024)
    latInput.setValue(
      "\uE003".repeat(latInput.getValue().length) + NEW_COORDS.lat
    )

    const lngInput = EditLocation.lngInputField
    // can't use clear because of https://github.com/webdriverio/webdriverio/issues/4482#issuecomment-543332411
    // when using setValue shouldn't append but it does (https://github.com/webdriverio/webdriverio/issues/3024)
    lngInput.setValue(
      "\uE003".repeat(lngInput.getValue().length) + NEW_COORDS.lng
    )

    EditLocation.allFormatsPopover.click()
    EditLocation.allFormatsPopoverLatLng.waitForExist()
    EditLocation.allFormatsPopoverMGRS.waitForExist()

    expect(EditLocation.allFormatsPopoverLatLng.getText()).toMatch(
      new RegExp(NEW_COORDS.lat, "g")
    )
    expect(EditLocation.allFormatsPopoverLatLng.getText()).toMatch(
      new RegExp(NEW_COORDS.lng, "g")
    )
    expect(EditLocation.allFormatsPopoverMGRS.getText()).toMatch(
      new RegExp(NEW_COORDS.mgrs, "g")
    )
  })

  it("Should save the edited location", () => {
    EditLocation.saveLocationButton.click()
    ShowLocation.successMsg.waitForExist()
    ShowLocation.successMsg.waitForDisplayed()
  })
})
