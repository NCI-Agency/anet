import { expect } from "chai"
import ShowPerson from "../pages/showPerson.page"

const PERSON_UUID = "6866ce4d-1f8c-4f78-bdc2-4767e9a859b0"

describe("Show person page", () => {
  beforeEach("Open the show person page", async() => {
    await ShowPerson.open(PERSON_UUID)
  })

  describe("When on the show page of a person with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      // Attachment container
      await (await ShowPerson.getAttachments()).waitForExist()
      await (await ShowPerson.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      // Attachment card list
      await (await ShowPerson.getCard()).waitForExist()
      await (await ShowPerson.getCard()).waitForDisplayed()
      expect(await await ShowPerson.getFileData()).to.be.equal(
        "test_pe…\n12.0 KB"
      )
    })
    it("We can go to the show page of Attachment", async() => {
      if (await (await ShowPerson.getImageClick()).isClickable()) {
        await (await ShowPerson.getImageClick()).click()
        await expect(browser).toHaveUrlContaining(
          "/attachments/87907f54-e997-47b3-adac-88f3344d4855"
        )
      }
    })
  })
})
