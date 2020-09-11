import EditLocation from "../pages/location/editLocation.page"

const EX_LOCATION_ID = "f2207d9b-204b-4cb5-874d-3fe6bc6f8acd"

const EXAMPLE_LAT_LNG_TO_CONVERT = {
  lat: "47.52963",
  lng: "-52.94612"
}

const EXAMPLE_MGRS_TO_BE_EXPECTED = "22TCT5351665858"

describe("When editing an existing location", () => {
  it("Should see latitude and longitude label when format selected LAT_LON", () => {
    EditLocation.open(EX_LOCATION_ID)
    EditLocation.latLngLabel.waitForExist()
    EditLocation.latLngLabel.waitForDisplayed()
  })

  it("Should correctly converts and displays both formats in the popover window", () => {
    const latInput = EditLocation.latInputField
    // known issue on chrome driver, setValue shouldn't append but it does (https://github.com/webdriverio/webdriverio/issues/3024)
    latInput.setValue(
      "\uE003".repeat(latInput.getValue().length) +
        EXAMPLE_LAT_LNG_TO_CONVERT.lat
    )

    const lngInput = EditLocation.lngInputField
    // known issue on chrome driver, setValue shouldn't append but it does (https://github.com/webdriverio/webdriverio/issues/3024)
    lngInput.setValue(
      "\uE003".repeat(lngInput.getValue().length) +
        EXAMPLE_LAT_LNG_TO_CONVERT.lng
    )

    EditLocation.allFormatsPopover.click()
    EditLocation.allFormatsPopoverLatLng.waitForExist()
    EditLocation.allFormatsPopoverMGRS.waitForExist()

    expect(EditLocation.allFormatsPopoverLatLng.getText()).toMatch(
      new RegExp(EXAMPLE_LAT_LNG_TO_CONVERT.lat, "g")
    )
    expect(EditLocation.allFormatsPopoverLatLng.getText()).toMatch(
      new RegExp(EXAMPLE_LAT_LNG_TO_CONVERT.lng, "g")
    )
    expect(EditLocation.allFormatsPopoverMGRS.getText()).toMatch(
      new RegExp(EXAMPLE_MGRS_TO_BE_EXPECTED, "g")
    )
  })
})
