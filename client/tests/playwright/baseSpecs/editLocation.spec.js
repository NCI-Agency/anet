import { expect } from "@playwright/test"
import CreateNewLocation from "../pages/location/createNewLocation.page.js"
import EditLocation from "../pages/location/editLocation.page.js"
import ShowLocation from "../pages/location/showLocation.page.js"
import { test, waitFor } from "../support.js"
import {
  LOCATION_COORDS,
  LOCATION_NAME,
  LOCATION_TYPE,
  NEW_COORDS
} from "./locationUtils.js"

test.describe("When editing a location", () => {
  test.beforeEach("Should create a new location first", async () => {
    await CreateNewLocation.open()
    await (await CreateNewLocation.getNameField()).fill(String(LOCATION_NAME))
    await (
      await CreateNewLocation.getTypeField()
    ).selectOption({
      index: LOCATION_TYPE.index
    })
    await (
      await CreateNewLocation.getLatField()
    ).fill(String(LOCATION_COORDS.lat))
    await (
      await CreateNewLocation.getLngField()
    ).fill(String(LOCATION_COORDS.lng))
    // trigger onblur effect
    await (await CreateNewLocation.getNameField()).click()
    await (await CreateNewLocation.getCreateButton()).click()
    // We are sent to showLocation page
    await waitFor(await ShowLocation.getSuccessMsg(), "visible")
    await (await ShowLocation.getEditButton()).click()
    // Now we are in the edit page
  })
  test.describe("When on the edit page of a location", () => {
    test("Should see the correct location type value of the created location", async () => {
      await waitFor(await EditLocation.getLocationTypeLabel(), "visible")
      await expect(await EditLocation.getLocationTypeField()).toHaveValue(
        LOCATION_TYPE.type
      )
    })
    test("Should see the correct latitude and longitude values of the created location when the selected format is LAT_LON", async () => {
      await waitFor(await EditLocation.getLatLngLabel(), "visible")
      await expect(await EditLocation.getLatInputField()).toHaveValue(
        LOCATION_COORDS.lat
      )
      await expect(await EditLocation.getLngInputField()).toHaveValue(
        LOCATION_COORDS.lng
      )
    })
    test("Should correctly edit and save input fields and display the correct values in both formats in the popover window", async () => {
      await editLatLngFields()
      await (await EditLocation.getAllFormatsPopover()).click()
      await waitFor(await EditLocation.getAllFormatsPopoverLat(), "attached")
      await waitFor(await EditLocation.getAllFormatsPopoverMGRS(), "attached")
      await expect(await EditLocation.getAllFormatsPopoverLat()).toHaveText(
        NEW_COORDS.lat,
        {
          useInnerText: true
        }
      )
      await expect(await EditLocation.getAllFormatsPopoverLng()).toHaveText(
        NEW_COORDS.lng,
        {
          useInnerText: true
        }
      )
      await expect(await EditLocation.getAllFormatsPopoverMGRS()).toHaveText(
        NEW_COORDS.mgrs,
        {
          useInnerText: true
        }
      )
      await (await EditLocation.getSaveLocationButton()).click()
      await waitFor(await ShowLocation.getSuccessMsg(), "visible")
      await expect(await ShowLocation.getLatField()).toHaveText(
        NEW_COORDS.lat,
        {
          useInnerText: true
        }
      )
      await expect(await ShowLocation.getLngField()).toHaveText(
        NEW_COORDS.lng,
        {
          useInnerText: true
        }
      )
    })
  })
})
async function editLatLngFields() {
  const latInput = await EditLocation.getLatInputField()
  await EditLocation.deleteInput(latInput)
  await latInput.fill(String(NEW_COORDS.lat))
  const lngInput = await EditLocation.getLngInputField()
  await EditLocation.deleteInput(lngInput)
  await lngInput.fill(String(NEW_COORDS.lng))
  // trigger onblur effect
  await (await CreateNewLocation.getNameField()).click()
}
