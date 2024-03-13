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
  beforeEach("Open the my attachments page", async() => {
    await MyAttachments.open("arthur")
  })

  afterEach("On the my attachments page...", async() => {
    await MyAttachments.logout()
  })

  describe("When checking the content of the page", () => {
    it("Should see a table of the user attachments", async() => {
      await (await MyAttachments.getMyAttachments()).waitForDisplayed()
      const myAttachments = await (
        await MyAttachments.getMyAttachments()
      ).$$("tr")
      // table has a header and 5 attachment rows
      expect(myAttachments).to.have.length(5)
    })
  })
})
