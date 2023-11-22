import { expect } from "chai"
import ShowPerson from "../pages/showPerson.page"

const PERSON_UUID = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"

describe("Show person page", () => {
  describe("When on the show page of a person with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      await ShowPerson.open(PERSON_UUID)
      await (await ShowPerson.getAttachments()).waitForExist()
      await (await ShowPerson.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      await (await ShowPerson.getCard()).waitForExist()
      await (await ShowPerson.getCard()).waitForDisplayed()
      expect(await ShowPerson.getFileData()).to.be.equal("attachPerson")
    })
    it("We can go to the show page of Attachment", async() => {
      await (await ShowPerson.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/13318e42-a0a3-438f-8ed5-dc16b1ef17bc"
      )
    })
  })
})
