import fs from "fs"
import { expect } from "chai"
import ShowAttachment from "../pages/attachment/showAttachment.page"

const ATTACHMENT_UUID = "f076406f-1a9b-4fc9-8ab2-cd2a138ec26d"
const ATTACHMENT_NAME = "test_attachment.png"
const ATTACHMENT_OWNER = "CIV DMIN, Arthur"
const ATTACHMENT_CLASSIFICATION = "UNDEFINED"
const ATTACHMENT_DESCRIPTION = "We can add multiple attachment for report"
const ATTACHMENT_MIMETYPE = "image/png"
const ATTACHMENT_USED_IN = "A test report from Arthur"
const ATTACHMENT_SIZE = 12316

describe("Show attachment page", () => {
  beforeEach("Open the show attachment page", async() => {
    await ShowAttachment.open(ATTACHMENT_UUID)
  })
  describe("When on the show page of a attachment", () => {
    it("We should see attachment's Download action button", async() => {
      const downloadButton = await ShowAttachment.getDownloadAttachmentButton()
      await downloadButton.waitForExist()
      await downloadButton.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await downloadButton.isExisting()).to.be.true
      // eslint-disable-next-line no-unused-expressions
      expect(await downloadButton.isClickable()).to.be.true
      await downloadButton.click()
      await browser.pause(1000)
      // file should be downloaded by now
      const stats = fs.statSync(ATTACHMENT_NAME)
      // eslint-disable-next-line no-unused-expressions
      expect(stats.isFile()).to.be.true
      expect(stats.size).to.equal(ATTACHMENT_SIZE)
      // clean up
      fs.rmSync(ATTACHMENT_NAME)
    })
    it("We should see image of attachment", async() => {
      await (await ShowAttachment.getImage()).waitForExist()
      await (await ShowAttachment.getImage()).waitForDisplayed()
    })
    it("We should see details of attachment", async() => {
      await (await ShowAttachment.getFilename()).waitForExist()
      await (await ShowAttachment.getFilename()).waitForDisplayed()
      expect(await (await ShowAttachment.getFilename()).getText()).to.equal(
        ATTACHMENT_NAME
      )

      await (await ShowAttachment.getContentLength()).waitForExist()
      await (await ShowAttachment.getContentLength()).waitForDisplayed()

      await (await ShowAttachment.getOwner()).waitForExist()
      await (await ShowAttachment.getOwner()).waitForDisplayed()
      expect(await (await ShowAttachment.getOwner()).getText()).to.equal(
        ATTACHMENT_OWNER
      )

      await (await ShowAttachment.getDescription()).waitForExist()
      await (await ShowAttachment.getDescription()).waitForDisplayed()
      expect(await (await ShowAttachment.getDescription()).getText()).to.equal(
        ATTACHMENT_DESCRIPTION
      )

      await (await ShowAttachment.getMimetype()).waitForExist()
      await (await ShowAttachment.getMimetype()).waitForDisplayed()
      expect(await (await ShowAttachment.getMimetype()).getText()).to.equal(
        ATTACHMENT_MIMETYPE
      )

      await (await ShowAttachment.getClassification()).waitForExist()
      await (await ShowAttachment.getClassification()).waitForDisplayed()
      expect(
        await (await ShowAttachment.getClassification()).getText()
      ).to.equal(ATTACHMENT_CLASSIFICATION)

      await (await ShowAttachment.getUsedin()).waitForExist()
      await (await ShowAttachment.getUsedin()).waitForDisplayed()
      expect(await (await ShowAttachment.getUsedin()).getText()).to.equal(
        ATTACHMENT_USED_IN
      )
    })
  })
})

describe("Edit attachment page", () => {
  beforeEach("Open the edit attachment page", async() => {
    await ShowAttachment.openEdit(ATTACHMENT_UUID)
  })
  describe("When on the edit page of attachment", () => {
    it("We should see the input areas for details of attachment", async() => {
      await (await ShowAttachment.getFilename()).waitForExist()
      await (await ShowAttachment.getFilename()).waitForDisplayed()
      expect(await (await ShowAttachment.getFilename()).getValue()).to.equal(
        ATTACHMENT_NAME
      )

      await (await ShowAttachment.getOwner()).waitForExist()
      await (await ShowAttachment.getOwner()).waitForDisplayed()
      expect(await (await ShowAttachment.getOwner()).getText()).to.equal(
        ATTACHMENT_OWNER
      )

      await (await ShowAttachment.getEditDescription()).waitForExist()
      await (await ShowAttachment.getEditDescription()).waitForDisplayed()
      expect(
        await (await ShowAttachment.getEditDescription()).getText()
      ).to.equal(ATTACHMENT_DESCRIPTION)
    })
  })
})
