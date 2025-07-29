import { expect } from "chai"
import MergePositions from "../pages/mergePositions.page"
import ShowPosition from "../pages/showPosition.page"

const POSITION_WITH_AG_UUID = "05c42ce0-34a0-4391-8b2f-c4cd85ee6b47" // EF 5.1 Advisor Quality Assurance
const POSITION_WITH_ATTACHMENTS_UUID = "888d6c4b-deaa-4218-b8fd-abfb7c81a4c6" // EF 1.1 Advisor G

describe("Show position page", () => {
  describe("When on the show page of a position with communities", () => {
    it("We should see a table with communities", async () => {
      await ShowPosition.open(POSITION_WITH_AG_UUID)
      await (await ShowPosition.getAuthorizationGroupsTable()).waitForExist()
      await (
        await ShowPosition.getAuthorizationGroupsTable()
      ).waitForDisplayed()
      expect(
        await (await ShowPosition.getAuthorizationGroupsTable()).getText()
      ).to.contain("EF 5")
    })
    it("We can go to the show page of a community", async () => {
      await (await ShowPosition.getAuthorizationGroup(1)).click()
      await expect(await browser.getUrl()).to.include(
        "/communities/ab1a7d99-4529-44b1-a118-bdee3ca8296b"
      )

      await ShowPosition.logout()
    })
  })

  describe("When on the show page of a position as admin", () => {
    it("We can select to merge it with another position", async () => {
      await ShowPosition.openAsAdminUser(POSITION_WITH_AG_UUID)
      await (await ShowPosition.getMergeButton()).click()
      await browser.pause(500) // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergePositions.getTitle()).to.exist
      expect(
        await (await MergePositions.getLeftPositionField()).getValue()
      ).to.contain("EF 5.1 Advisor Quality Assurance")
      // eslint-disable-next-line no-unused-expressions
      expect(await (await MergePositions.getLeftPositionField()).isEnabled()).to
        .be.false
      await ShowPosition.logout()
    })
  })

  describe("When on the show page of a position with attachment(s)", () => {
    it("We should see a container for Attachment List", async () => {
      await ShowPosition.openAsAdminUser(POSITION_WITH_ATTACHMENTS_UUID)
      await (await ShowPosition.getAttachments()).waitForExist()
      await (await ShowPosition.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async () => {
      await (await ShowPosition.getCard()).waitForExist()
      await (await ShowPosition.getCard()).waitForDisplayed()
      expect(await ShowPosition.getCaption()).to.be.equal("EF 1.1 Advisor G")
    })
    it("We should be able to edit the attachments", async () => {
      const editAttachmentsButton =
        await ShowPosition.getEditAttachmentsButton()
      expect(await editAttachmentsButton.getText()).to.be.equal(
        "Edit attachments"
      )
      await editAttachmentsButton.click()
      expect(await editAttachmentsButton.getText()).to.be.equal(
        "View attachments"
      )

      const editButton = await browser.$(".attachment-card .button-line a")
      await expect(await editButton.getAttribute("href")).to.include(
        "/attachments/1d234036-1d6c-4cb0-8b1a-e4305aeca1e2/edit"
      )
      await editAttachmentsButton.click()
    })
    it("We can go to the show page of Attachment", async () => {
      await (await ShowPosition.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/1d234036-1d6c-4cb0-8b1a-e4305aeca1e2"
      )
    })
  })

  describe("When on the show page of a position with entity avatar", () => {
    it("We should see the avatar", async () => {
      await ShowPosition.openAsAdminUser(POSITION_WITH_ATTACHMENTS_UUID)
      await (await ShowPosition.getEntityAvatar()).waitForExist()
      await (await ShowPosition.getEntityAvatar()).waitForDisplayed()
    })
  })
})
