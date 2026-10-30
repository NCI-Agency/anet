import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import MyAttachmentsPageObject from "../pages/myAttachments.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, MyAttachments
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    MyAttachments = new MyAttachmentsPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Home page", () => {
    test.describe("When checking the navigation items", () => {
      test("Should see a link to my attachments page", async () => {
        await Home.open()
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyAttachmentsLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
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
          state: "visible",
          timeout: 10000
        })
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
})
