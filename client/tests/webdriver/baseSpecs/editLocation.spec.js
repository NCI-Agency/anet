import CreateNewLocation from "../pages/location/createNewLocation.page"
import EditLocation from "../pages/location/editLocation.page"
import ShowLocation from "../pages/location/showLocation.page"
import { LOCATION_COORDS, LOCATION_NAME, NEW_COORDS } from "./locationUtils"

describe("When editing a location", () => {
  beforeEach("Should create a new location first", () => {
    CreateNewLocation.open(LOCATION_NAME)
    CreateNewLocation.nameField.setValue(LOCATION_NAME)
    CreateNewLocation.latField.setValue(LOCATION_COORDS.lat)
    CreateNewLocation.lngField.setValue(LOCATION_COORDS.lng)
    CreateNewLocation.createButton.click()
    // We are sent to showLocation page
    ShowLocation.successMsg.waitForExist()
    ShowLocation.successMsg.waitForDisplayed()
    ShowLocation.editButton.waitForExist()
    ShowLocation.editButton.waitForDisplayed()
    ShowLocation.editButton.click()
    // Now we are in the edit page
  })

  it("Should see the correct latitude and longitude values of the created location when the selected format is LAT_LON", () => {
    EditLocation.latLngLabel.waitForExist()
    EditLocation.latLngLabel.waitForDisplayed()

    expect(EditLocation.latInputField.getValue()).toEqual(LOCATION_COORDS.lat)
    expect(EditLocation.lngInputField.getValue()).toEqual(LOCATION_COORDS.lng)
  })

  it("Should correctly edit and save input fields and display the correct values in both formats in the popover window", () => {
    editLatLngFields()
    EditLocation.allFormatsPopover.click()
    EditLocation.allFormatsPopoverLat.waitForExist()
    EditLocation.allFormatsPopoverMGRS.waitForExist()

    expect(EditLocation.allFormatsPopoverLat.getText()).toEqual(NEW_COORDS.lat)
    expect(EditLocation.allFormatsPopoverLng.getText()).toEqual(NEW_COORDS.lng)
    expect(EditLocation.allFormatsPopoverMGRS.getText()).toEqual(
      NEW_COORDS.mgrs
    )

    EditLocation.saveLocationButton.click()
    ShowLocation.successMsg.waitForExist()
    ShowLocation.successMsg.waitForDisplayed()

    expect(ShowLocation.latField.getText()).toEqual(NEW_COORDS.lat)
    expect(ShowLocation.lngField.getText()).toEqual(NEW_COORDS.lng)
  })
})

function editLatLngFields() {
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
}
