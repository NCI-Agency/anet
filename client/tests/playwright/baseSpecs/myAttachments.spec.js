import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import MyAttachmentsPageObject from "../pages/myAttachments.page.js"

test.describe(() => {
  let Home, MyAttachments
  test.beforeEach(async ({ page }) => {
    Home = new HomePageObject(page)
    MyAttachments = new MyAttachmentsPageObject(page)
  })
  test.describe("Home page", () => {
    test.describe("When checking the navigation items", () => {
      test("Should see a link to my attachments page", async () => {
        await Home.open()
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyAttachmentsLink()
        ).waitFor({
          state: "visible"
        })
        await expect(await Home.getMyAttachmentsLink()).not.toHaveCount(0)
        await Home.logout()
      })
    })
  })
  test.describe("My Attachments page", () => {
    test.describe("When checking the content of the page", () => {
      test("Should see a table of arthur's attachments", async () => {
        await MyAttachments.openAsAdminUser()
        await (
          await MyAttachments.getMyAttachments()
        ).waitFor({
          state: "visible"
        })
        const attachmentRows = await MyAttachments.getAttachmentRows()
        // table has 10 attachment rows
        await expect(attachmentRows).toHaveCount(10)
        // Check the whole distribution in one retrying snapshot. Separate counts
        // could pass against different intermediate renders of the table.
        const classifications =
          await MyAttachments.getAttachmentClassifications()
        await expect
          .poll(async () => {
            const classificationCounts = {}
            for (const classification of await classifications.allTextContents()) {
              const label = classification.trim()
              classificationCounts[label] =
                (classificationCounts[label] ?? 0) + 1
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
})
