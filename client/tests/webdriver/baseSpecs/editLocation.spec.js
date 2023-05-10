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
  beforeEach("Should create a new location first", async() => {
    await CreateNewLocation.open()
    await (await CreateNewLocation.getNameField()).setValue(LOCATION_NAME)
    await (
      await CreateNewLocation.getTypeField()
    ).selectByIndex(LOCATION_TYPE.index)
    await (await CreateNewLocation.getLatField()).setValue(LOCATION_COORDS.lat)
    await (await CreateNewLocation.getLngField()).setValue(LOCATION_COORDS.lng)
    // trigger onblur effect
    await (await CreateNewLocation.getNameField()).click()
    await (await CreateNewLocation.getCreateButton()).click()
    // We are sent to showLocation page
    await (await ShowLocation.getSuccessMsg()).waitForExist()
    await (await ShowLocation.getSuccessMsg()).waitForDisplayed()
    await (await ShowLocation.getEditButton()).waitForExist()
    await (await ShowLocation.getEditButton()).waitForDisplayed()
    await (await ShowLocation.getEditButton()).click()
    // Now we are in the edit page
  })

  describe("When on the edit page of a location", () => {
    it("Should see the correct location type value of the created location", async() => {
      await (await EditLocation.getLocationTypeLabel()).waitForExist()
      await (await EditLocation.getLocationTypeLabel()).waitForDisplayed()

      expect(
        await (await EditLocation.getLocationTypeField()).getValue()
      ).to.equal(LOCATION_TYPE.type)
    })

    it("Should see the correct latitude and longitude values of the created location when the selected format is LAT_LON", async() => {
      await (await EditLocation.getLatLngLabel()).waitForExist()
      await (await EditLocation.getLatLngLabel()).waitForDisplayed()

      expect(await (await EditLocation.getLatInputField()).getValue()).to.equal(
        LOCATION_COORDS.lat
      )
      expect(await (await EditLocation.getLngInputField()).getValue()).to.equal(
        LOCATION_COORDS.lng
      )
    })

    it("Should correctly edit and save input fields and display the correct values in both formats in the popover window", async() => {
      await editLatLngFields()
      await (await EditLocation.getAllFormatsPopover()).click()
      await (await EditLocation.getAllFormatsPopoverLat()).waitForExist()
      await (await EditLocation.getAllFormatsPopoverMGRS()).waitForExist()

      expect(
        await (await EditLocation.getAllFormatsPopoverLat()).getText()
      ).to.equal(NEW_COORDS.lat)
      expect(
        await (await EditLocation.getAllFormatsPopoverLng()).getText()
      ).to.equal(NEW_COORDS.lng)
      expect(
        await (await EditLocation.getAllFormatsPopoverMGRS()).getText()
      ).to.equal(NEW_COORDS.mgrs)

      await (await EditLocation.getSaveLocationButton()).click()
      await (await ShowLocation.getSuccessMsg()).waitForExist()
      await (await ShowLocation.getSuccessMsg()).waitForDisplayed()

      expect(await (await ShowLocation.getLatField()).getText()).to.equal(
        NEW_COORDS.lat
      )
      expect(await (await ShowLocation.getLngField()).getText()).to.equal(
        NEW_COORDS.lng
      )
    })
  })
})

async function editLatLngFields() {
  const latInput = await EditLocation.getLatInputField()
  await EditLocation.deleteInput(latInput)
  await latInput.setValue(NEW_COORDS.lat)

  const lngInput = await EditLocation.getLngInputField()
  await EditLocation.deleteInput(lngInput)
  await lngInput.setValue(NEW_COORDS.lng)
  // trigger onblur effect
  await (await CreateNewLocation.getNameField()).click()
}
