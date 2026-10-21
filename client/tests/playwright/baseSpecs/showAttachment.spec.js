import fs from "fs"
import { expect } from "@playwright/test"
import ShowAttachment from "../pages/attachment/showAttachment.page.js"
import { currentPage, test, waitFor } from "../support.js"

const ATTACHMENT_UUID = "f076406f-1a9b-4fc9-8ab2-cd2a138ec26d"
const ATTACHMENT_NAME = "attachReport.png"
const ATTACHMENT_CAPTION = "Arthur's test report"
const ATTACHMENT_OWNER = "CIV Arthur Dmin"
const ATTACHMENT_CLASSIFICATION = "NATO UNCLASSIFIED"
const ATTACHMENT_DESCRIPTION = "We can add attachments to a report"
const ATTACHMENT_MIMETYPE = "image/png"
const ATTACHMENT_USED_IN = "A test report from Arthur"
const ATTACHMENT_SIZE = 12316
async function checkDownloadedFile(attachmentName, attachmentSize) {
  const stats = fs.statSync(attachmentName)
  expect(stats.isFile()).toBe(true)
  expect(stats.size).toBe(attachmentSize)
  // clean up
  fs.rmSync(attachmentName)
}
test.describe("Show attachment page", () => {
  test.beforeEach("Open the show attachment page", async () => {
    await ShowAttachment.open(ATTACHMENT_UUID)
  })
  test.describe("When on the show page of a attachment", () => {
    test("We should see attachment's Download action button", async () => {
      const downloadButton = await ShowAttachment.getDownloadAttachmentButton()
      await waitFor(downloadButton, "visible")

      await expect(downloadButton).not.toHaveCount(0)
      await expect(downloadButton).toBeEnabled()
      const downloadStarted = currentPage().waitForEvent("download")
      await downloadButton.click()
      const download = await downloadStarted
      expect(download.suggestedFilename()).toBe(ATTACHMENT_NAME)
      await checkDownloadedFile(await download.path(), ATTACHMENT_SIZE)
    })
    test("We should see image of attachment", async () => {
      await waitFor(await ShowAttachment.getImage(), "visible")
    })
    test("We should see details of attachment", async () => {
      await waitFor(await ShowAttachment.getFilename(), "visible")
      await expect(await ShowAttachment.getFilename()).toHaveText(
        ATTACHMENT_NAME,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getContentLength(), "visible")
      await waitFor(await ShowAttachment.getOwner(), "visible")
      await expect(await ShowAttachment.getOwner()).toHaveText(
        ATTACHMENT_OWNER,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getDescription(), "visible")
      await expect(await ShowAttachment.getDescription()).toHaveText(
        ATTACHMENT_DESCRIPTION,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getMimetype(), "visible")
      await expect(await ShowAttachment.getMimetype()).toHaveText(
        ATTACHMENT_MIMETYPE,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getClassification(), "visible")
      await expect(await ShowAttachment.getClassification()).toHaveText(
        ATTACHMENT_CLASSIFICATION,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getUsedin(), "visible")
      await expect(await ShowAttachment.getUsedin()).toHaveText(
        ATTACHMENT_USED_IN,
        {
          useInnerText: true
        }
      )
    })
  })
})
test.describe("Edit attachment page", () => {
  test.beforeEach("Open the edit attachment page", async () => {
    await ShowAttachment.openEdit(ATTACHMENT_UUID)
  })
  test.describe("When on the edit page of attachment", () => {
    test("We should see the input areas for details of attachment", async () => {
      await waitFor(await ShowAttachment.getFilename(), "visible")
      await expect(await ShowAttachment.getFilename()).toHaveText(
        ATTACHMENT_NAME,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getCaption(), "visible")
      await expect(await ShowAttachment.getCaption()).toHaveValue(
        ATTACHMENT_CAPTION
      )
      await waitFor(await ShowAttachment.getOwner(), "visible")
      await expect(await ShowAttachment.getOwner()).toHaveText(
        ATTACHMENT_OWNER,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowAttachment.getEditDescription(), "visible")
      await expect(await ShowAttachment.getEditDescription()).toHaveText(
        ATTACHMENT_DESCRIPTION,
        {
          useInnerText: true
        }
      )
    })
  })
})
