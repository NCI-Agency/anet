import { expect } from "chai"
import ShowLocation from "../pages/location/showLocation.page"

const LOCATION_UUID = "e5b3a4b9-acf7-4c79-8224-f248b9a7215d"

describe("Show location page", () => {
  beforeEach("Open the show location page", async() => {
    await ShowLocation.open(LOCATION_UUID)
  })

  describe("WHen on the show page of a location with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      // Attachment container
      await (await ShowLocation.getAttachments()).waitForExist()
      await (await ShowLocation.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      // Attachment card list
      await (await ShowLocation.getCard()).waitForExist()
      await (await ShowLocation.getCard()).waitForDisplayed()
      expect(await await ShowLocation.getFileData()).to.be.equal(
        "attachL…\n-1 bytes"
      )
    })
    it("We can go to the show page of Attachment", async() => {
      if (await (await ShowLocation.getImageClick()).isClickable()) {
        await (await ShowLocation.getImageClick()).click()
        await expect(browser).toHaveUrlContaining(
          "/attachments/f7cd5b02-ef73-4ee8-814b-c5a7a916685d"
        )
      }
    })
  })
})
