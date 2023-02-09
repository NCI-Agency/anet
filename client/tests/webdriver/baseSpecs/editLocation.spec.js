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
    CreateNewLocation.getNameField().setValue(LOCATION_NAME)
    CreateNewLocation.getTypeField().selectByIndex(LOCATION_TYPE.index)
    CreateNewLocation.getLatField().setValue(LOCATION_COORDS.lat)
    CreateNewLocation.getLngField().setValue(LOCATION_COORDS.lng)
    // trigger onblur effect
    CreateNewLocation.getNameField().click()
    CreateNewLocation.getCreateButton().click()
    // We are sent to showLocation page
    ShowLocation.getSuccessMsg().waitForExist()
    ShowLocation.getSuccessMsg().waitForDisplayed()
    ShowLocation.getEditButton().waitForExist()
    ShowLocation.getEditButton().waitForDisplayed()
    ShowLocation.getEditButton().click()
    // Now we are in the edit page
  })

  describe("When on the edit page of a location", () => {
    it("Should see the correct location type value of the created location", () => {
      EditLocation.getLocationTypeLabel().waitForExist()
      EditLocation.getLocationTypeLabel().waitForDisplayed()

      expect(EditLocation.getLocationTypeField().getValue()).to.equal(
        LOCATION_TYPE.type
      )
    })

    it("Should see the correct latitude and longitude values of the created location when the selected format is LAT_LON", () => {
      EditLocation.getLatLngLabel().waitForExist()
      EditLocation.getLatLngLabel().waitForDisplayed()

      expect(EditLocation.getLatInputField().getValue()).to.equal(
        LOCATION_COORDS.lat
      )
      expect(EditLocation.getLngInputField().getValue()).to.equal(
        LOCATION_COORDS.lng
      )
    })

    it("Should correctly edit and save input fields and display the correct values in both formats in the popover window", () => {
      editLatLngFields()
      EditLocation.getAllFormatsPopover().click()
      EditLocation.getAllFormatsPopoverLat().waitForExist()
      EditLocation.getAllFormatsPopoverMGRS().waitForExist()

      expect(EditLocation.getAllFormatsPopoverLat().getText()).to.equal(
        NEW_COORDS.lat
      )
      expect(EditLocation.getAllFormatsPopoverLng().getText()).to.equal(
        NEW_COORDS.lng
      )
      expect(EditLocation.getAllFormatsPopoverMGRS().getText()).to.equal(
        NEW_COORDS.mgrs
      )

      EditLocation.getSaveLocationButton().click()
      ShowLocation.getSuccessMsg().waitForExist()
      ShowLocation.getSuccessMsg().waitForDisplayed()

      expect(ShowLocation.getLatField().getText()).to.equal(NEW_COORDS.lat)
      expect(ShowLocation.getLngField().getText()).to.equal(NEW_COORDS.lng)
    })
  })
})

function editLatLngFields() {
  const latInput = EditLocation.getLatInputField()
  EditLocation.deleteInput(latInput)
  latInput.setValue(NEW_COORDS.lat)

  const lngInput = EditLocation.getLngInputField()
  EditLocation.deleteInput(lngInput)
  lngInput.setValue(NEW_COORDS.lng)
  // trigger onblur effect
  CreateNewLocation.getNameField().click()
}
