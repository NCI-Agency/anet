import EditLocation from "../pages/location/editLocation.page"

const EX_LOCATION_ID = "f2207d9b-204b-4cb5-874d-3fe6bc6f8acd"

describe("When editing an existing location", () => {
  it("Should see latitude and longitude label when format selected LAT_LON", () => {
    EditLocation.open(EX_LOCATION_ID)
    EditLocation.latLngLabel.waitForExist()
    EditLocation.latLngLabel.waitForDisplayed()
  })
})
