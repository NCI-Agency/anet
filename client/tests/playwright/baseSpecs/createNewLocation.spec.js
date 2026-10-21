import { expect } from "@playwright/test"
import CreateNewLocation from "../pages/location/createNewLocation.page.js"
import { test, waitFor } from "../support.js"
import {
  BAD_LAT_LNG_VAL,
  DESCRIPTION,
  LOCATION_COORDS,
  LOCATION_NAME,
  LOCATION_TYPE,
  NOT_SIMILAR_LOCATION,
  SIMILAR_LOCATION
} from "./locationUtils.js"

test.describe("When creating a new Location", () => {
  test("Should not create a location without name & type input", async () => {
    await CreateNewLocation.open()
    await (await CreateNewLocation.getCreateButton()).click()
    await waitFor(await CreateNewLocation.getNameRequiredError(), "visible")
    await waitFor(await CreateNewLocation.getTypeRequiredError(), "visible")
  })
  test("Should display possible duplicates with similar names", async () => {
    await (
      await CreateNewLocation.getNameField()
    ).fill(String(SIMILAR_LOCATION.name))
    await (
      await CreateNewLocation.getTypeField()
    ).selectOption({
      index: LOCATION_TYPE.index
    })
    await (await CreateNewLocation.getDuplicatesButton()).click()
    // wait for the modal to slide in (transition is 300 ms)
    await waitFor(await CreateNewLocation.getModalContent(), "visible")
    await expect(await CreateNewLocation.getSimilarLocation()).toHaveText(
      "Kabul Hospital",
      { useInnerText: true }
    )
    await (await CreateNewLocation.getModalCloseButton()).click()
    // wait for the modal to slide out (transition is 300 ms)
    await waitFor(await CreateNewLocation.getModalContent(), "visible", {
      reverse: true
    })
  })
  test("Should not accept invalid latitude-longitude inputs", async () => {
    await (await CreateNewLocation.getNameField()).fill(String(LOCATION_NAME))
    await (await CreateNewLocation.getLatField()).fill(String(BAD_LAT_LNG_VAL))
    await (await CreateNewLocation.getLngField()).fill(String(BAD_LAT_LNG_VAL))
    // trigger onblur effect
    await (await CreateNewLocation.getNameField()).click()
    await CreateNewLocation.latLngErrorsDisplayed()
  })
  test("Should have a location with correct MGRS in popover", async () => {
    await CreateNewLocation.deleteInput(CreateNewLocation.getLatField())
    await (
      await CreateNewLocation.getLatField()
    ).fill(String(LOCATION_COORDS.lat))
    await CreateNewLocation.deleteInput(CreateNewLocation.getLngField())
    await (
      await CreateNewLocation.getLngField()
    ).fill(String(LOCATION_COORDS.lng))
    await CreateNewLocation.fillLocationDescription(DESCRIPTION)
    // trigger onblur effect
    await (await CreateNewLocation.getNameField()).click()
    await (await CreateNewLocation.getAllFormatsPopover()).click()
    await waitFor(await CreateNewLocation.getAllFormatsPopoverLat(), "attached")
    await waitFor(
      await CreateNewLocation.getAllFormatsPopoverMGRS(),
      "attached"
    )
    await expect(await CreateNewLocation.getAllFormatsPopoverLat()).toHaveText(
      LOCATION_COORDS.lat,
      {
        useInnerText: true
      }
    )
    await expect(await CreateNewLocation.getAllFormatsPopoverLng()).toHaveText(
      LOCATION_COORDS.lng,
      {
        useInnerText: true
      }
    )
    await expect(await CreateNewLocation.getAllFormatsPopoverMGRS()).toHaveText(
      LOCATION_COORDS.mgrs,
      {
        useInnerText: true
      }
    )
  })
  test("Should create a location successfully", async () => {
    await (await CreateNewLocation.getCreateButton()).click()
    await waitFor(await CreateNewLocation.getSuccessMsg(), "visible")
  })
  test("Should not display possible duplicates button", async () => {
    await CreateNewLocation.open()
    await waitFor(await CreateNewLocation.getForm(), "visible")
    await (
      await CreateNewLocation.getNameField()
    ).fill(String(NOT_SIMILAR_LOCATION.name))
    await expect(await CreateNewLocation.getDuplicatesButton()).toHaveCount(0)
  })
  test("Should allow map maximisation", async () => {
    await expect(
      await CreateNewLocation.getMaximiseLeafletButton()
    ).toHaveAttribute("title", "Full Screen")
    await (await CreateNewLocation.getMaximiseLeafletButton()).click()
    await expect(
      await CreateNewLocation.getMinimiseLeafletButton()
    ).toHaveAttribute("title", "Exit Full Screen")
  })
})
