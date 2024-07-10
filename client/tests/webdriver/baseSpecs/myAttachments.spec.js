import { expect } from "chai"
import Home from "../pages/home.page"
import MyAttachments from "../pages/myAttachments.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my attachments page", async() => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyAttachmentsLink()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyAttachmentsLink()).isExisting()).to.be.true
      await Home.logout()
    })
  })
})

describe("My Attachments page", () => {
  describe("When checking the content of the page", () => {
    it("Should see a table of arthur's attachments", async() => {
      await MyAttachments.openAsAdminUser()
      await (await MyAttachments.getMyAttachments()).waitForDisplayed()
      const myAttachments = await (
        await MyAttachments.getMyAttachments()
      ).$$("table.attachments_table > tbody > tr")
      // table has a header and 6 attachment rows
      expect(myAttachments).to.have.length(6)
      await MyAttachments.logout()
    })
  })
})
