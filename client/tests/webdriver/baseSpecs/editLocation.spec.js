import { expect } from "chai"
import CreateNewLocation from "../pages/location/createNewLocation.page"
import EditLocation from "../pages/location/editLocation.page"
import ShowLocation from "../pages/location/showLocation.page"
import {
  LOCATION_COORDS,
  LOCATION_NAME,
  LOCATION_TYPE,
  NEW_COORDS
} from "./locationUtils"

describe("When editing a location", () => {
  beforeEach("Should create a new location first", () => {
    CreateNewLocation.open()
    CreateNewLocation.nameField.setValue(LOCATION_NAME)
    CreateNewLocation.typeField.selectByIndex(LOCATION_TYPE.index)
    CreateNewLocation.latField.setValue(LOCATION_COORDS.lat)
    CreateNewLocation.lngField.setValue(LOCATION_COORDS.lng)
    // trigger onblur effect
    CreateNewLocation.nameField.click()
    CreateNewLocation.createButton.click()
    // We are sent to showLocation page
    ShowLocation.successMsg.waitForExist()
    ShowLocation.successMsg.waitForDisplayed()
    ShowLocation.editButton.waitForExist()
    ShowLocation.editButton.waitForDisplayed()
    ShowLocation.editButton.click()
    // Now we are in the edit page
  })

  describe("When on the edit page of a location", () => {
    it("Should see the correct location type value of the created location", () => {
      EditLocation.locationTypeLabel.waitForExist()
      EditLocation.locationTypeLabel.waitForDisplayed()

      expect(EditLocation.locationTypeField.getValue()).to.equal(
        LOCATION_TYPE.type
      )
    })

    it("Should see the correct latitude and longitude values of the created location when the selected format is LAT_LON", () => {
      EditLocation.latLngLabel.waitForExist()
      EditLocation.latLngLabel.waitForDisplayed()

      expect(EditLocation.latInputField.getValue()).to.equal(
        LOCATION_COORDS.lat
      )
      expect(EditLocation.lngInputField.getValue()).to.equal(
        LOCATION_COORDS.lng
      )
    })

    it("Should correctly edit and save input fields and display the correct values in both formats in the popover window", () => {
      editLatLngFields()
      EditLocation.allFormatsPopover.click()
      EditLocation.allFormatsPopoverLat.waitForExist()
      EditLocation.allFormatsPopoverMGRS.waitForExist()

      expect(EditLocation.allFormatsPopoverLat.getText()).to.equal(
        NEW_COORDS.lat
      )
      expect(EditLocation.allFormatsPopoverLng.getText()).to.equal(
        NEW_COORDS.lng
      )
      expect(EditLocation.allFormatsPopoverMGRS.getText()).to.equal(
        NEW_COORDS.mgrs
      )

      EditLocation.saveLocationButton.click()
      ShowLocation.successMsg.waitForExist()
      ShowLocation.successMsg.waitForDisplayed()

      expect(ShowLocation.latField.getText()).to.equal(NEW_COORDS.lat)
      expect(ShowLocation.lngField.getText()).to.equal(NEW_COORDS.lng)
    })
  })
})

function editLatLngFields() {
  const latInput = EditLocation.latInputField
  EditLocation.deleteInput(latInput)
  latInput.setValue(NEW_COORDS.lat)

  const lngInput = EditLocation.lngInputField
  EditLocation.deleteInput(lngInput)
  lngInput.setValue(NEW_COORDS.lng)
  // trigger onblur effect
  CreateNewLocation.nameField.click()
}
