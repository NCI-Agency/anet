import { expect } from "@playwright/test"
import Home from "../pages/home.page.js"
import MyAttachments from "../pages/myAttachments.page.js"
import { test, waitFor } from "../support.js"

test.describe("Home page", () => {
  test.describe("When checking the navigation items", () => {
    test("Should see a link to my attachments page", async () => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyAttachmentsLink(), "visible")
      await expect(await Home.getMyAttachmentsLink()).not.toHaveCount(0)
      await Home.logout()
    })
  })
})
test.describe("My Attachments page", () => {
  test.describe("When checking the content of the page", () => {
    test("Should see a table of arthur's attachments", async () => {
      await MyAttachments.openAsAdminUser()
      await waitFor(await MyAttachments.getMyAttachments(), "visible")
      const attachmentRows = await MyAttachments.getAttachmentRows()
      // table has 10 attachment rows
      await expect(attachmentRows).toHaveCount(10)
      // check the classifications
      const attachmentClassifications = {}
      for (const attachmentRow of await attachmentRows.all()) {
        const attachmentCaptionCell =
          await MyAttachments.getAttachmentCaptionCell(attachmentRow)
        const classification = (
          await (
            await MyAttachments.getAttachmentClassification(
              attachmentCaptionCell
            )
          ).innerText()
        ).trim()
        attachmentClassifications[classification] =
          (attachmentClassifications[classification] ?? 0) + 1
      }
      expect(Object.keys(attachmentClassifications)).toHaveLength(3)
      expect(attachmentClassifications["[Public]"]).toBe(8)
      expect(attachmentClassifications["[NATO UNCLASSIFIED]"]).toBe(1)
      expect(
        attachmentClassifications["[NATO UNCLASSIFIED Releasable to EU]"]
      ).toBe(1)
      await MyAttachments.logout()
    })
  })
})
