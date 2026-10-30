import { expect, test } from "@playwright/test"
import CreateNewLocationPageObject from "../pages/location/createNewLocation.page.js"
import EditLocationPageObject from "../pages/location/editLocation.page.js"
import ShowLocationPageObject from "../pages/location/showLocation.page.js"
import {
  LOCATION_COORDS,
  LOCATION_NAME,
  LOCATION_TYPE,
  NEW_COORDS
} from "./locationUtils.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, CreateNewLocation, EditLocation, ShowLocation
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    CreateNewLocation = new CreateNewLocationPageObject(page)
    EditLocation = new EditLocationPageObject(page)
    ShowLocation = new ShowLocationPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
      await (
        await ShowLocation.getSuccessMsg()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await ShowLocation.getEditButton()).click()
      // Now we are in the edit page
    })
    test.describe("When on the edit page of a location", () => {
      test("Should see the correct location type value of the created location", async () => {
        await (
          await EditLocation.getLocationTypeLabel()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await EditLocation.getLocationTypeField()).toHaveValue(
          LOCATION_TYPE.type
        )
      })
      test("Should see the correct latitude and longitude values of the created location when the selected format is LAT_LON", async () => {
        await (
          await EditLocation.getLatLngLabel()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
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
        await (
          await EditLocation.getAllFormatsPopoverLat()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
        await (
          await EditLocation.getAllFormatsPopoverMGRS()
        ).waitFor({
          state: "attached",
          timeout: 10000
        })
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
        await (
          await ShowLocation.getSuccessMsg()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
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
})
