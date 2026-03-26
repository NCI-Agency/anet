import { expect } from "chai"
import Home from "../pages/home.page"
import MyAttachments from "../pages/myAttachments.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my attachments page", async () => {
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
    it("Should see a table of arthur's attachments", async () => {
      await MyAttachments.openAsAdminUser()
      await (await MyAttachments.getMyAttachments()).waitForDisplayed()
      const attachmentRows = await MyAttachments.getAttachmentRows()
      // table has 10 attachment rows
      expect(attachmentRows).to.have.length(10)
      // check the classifications
      const attachmentClassifications = {}
      for (const attachmentRow of attachmentRows) {
        const attachmentCaptionCell =
          await MyAttachments.getAttachmentCaptionCell(attachmentRow)
        const classification = await (
          await MyAttachments.getAttachmentClassification(attachmentCaptionCell)
        ).getText()
        attachmentClassifications[classification] =
          (attachmentClassifications[classification] ?? 0) + 1
      }
      expect(Object.keys(attachmentClassifications)).to.have.length(3)
      expect(attachmentClassifications["[Public]"]).to.equal(8)
      expect(attachmentClassifications["[NATO UNCLASSIFIED]"]).to.equal(1)
      expect(
        attachmentClassifications["[NATO UNCLASSIFIED Releasable to EU]"]
      ).to.equal(1)
      await MyAttachments.logout()
    })
  })
})
