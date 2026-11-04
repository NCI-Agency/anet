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
      // Check the whole distribution in one retrying snapshot. Separate counts
      // could pass against different intermediate renders of the table.
      const classifications = await MyAttachments.getAttachmentClassifications()
      await expect
        .poll(async () => {
          const classificationCounts = {}
          for (const classification of await classifications.allTextContents()) {
            const label = classification.trim()
            classificationCounts[label] = (classificationCounts[label] ?? 0) + 1
          }
          return classificationCounts
        })
        .toEqual({
          "[Public]": 8,
          "[NATO UNCLASSIFIED]": 1,
          "[NATO UNCLASSIFIED Releasable to EU]": 1
        })
      await MyAttachments.logout()
    })
  })
})
