import { expect } from "chai"
import ShowLocation from "../pages/location/showLocation.page"
import MergeLocations from "../pages/mergeLocations.page"

const LOCATION_WITH_ATTACHMENTS_UUID = "e5b3a4b9-acf7-4c79-8224-f248b9a7215d" // Antarctica
const LOCATION_WITH_ORGANIZATIONS_UUID = "9c982685-5946-4dad-a7ee-0f5a12f5e170" // Wishingwells Park
const LOCATION_WITH_POSITIONS_UUID = "cc49bb27-4d8f-47a8-a9ee-af2b68b992ac" // St Johns Airport
const LOCATION_WITH_REPORTS_UUID = "0855fb0a-995e-4a79-a132-4024ee2983ff" // General Hospital

describe("Show location page", () => {
  describe("When on the show page of a location with attachment(s)", () => {
    it("We should see a container for Attachment List", async() => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      await (await ShowLocation.getAttachments()).waitForExist()
      await (await ShowLocation.getAttachments()).waitForDisplayed()
    })
    it("We should see a card of Attachment", async() => {
      await (await ShowLocation.getCard()).waitForExist()
      await (await ShowLocation.getCard()).waitForDisplayed()
      expect(await ShowLocation.getCaption()).to.be.equal("Antarctica")
    })
    it("We should be able to edit the attachments", async() => {
      const editAttachmentsButton =
        await ShowLocation.getEditAttachmentsButton()
      expect(await editAttachmentsButton.getText()).to.be.equal(
        "Edit attachments"
      )
      await editAttachmentsButton.click()
      expect(await editAttachmentsButton.getText()).to.be.equal(
        "View attachments"
      )

      const editButton = await browser.$(".attachment-card .button-line a")
      await expect(await editButton.getAttribute("href")).to.include(
        "/attachments/f7cd5b02-ef73-4ee8-814b-c5a7a916685d/edit"
      )
      await editAttachmentsButton.click()
    })
    it("We can go to the show page of Attachment", async() => {
      await (await ShowLocation.getImageClick()).click()
      await expect(await browser.getUrl()).to.include(
        "/attachments/f7cd5b02-ef73-4ee8-814b-c5a7a916685d"
      )
    })
  })

  describe("When on the show page of a location with organizations", () => {
    it("We should see rows in the organizations table", async() => {
      await ShowLocation.open(LOCATION_WITH_ORGANIZATIONS_UUID)
      await (await ShowLocation.getTable("organizations_table")).waitForExist()
      await (
        await ShowLocation.getTable("organizations_table")
      ).waitForDisplayed()
      expect(
        await ShowLocation.getTableRows("organizations_table")
      ).to.have.lengthOf.above(0)
    })
  })

  describe("When on the show page of a location with positions", () => {
    it("We should see rows in the positions table", async() => {
      await ShowLocation.open(LOCATION_WITH_POSITIONS_UUID)
      await (await ShowLocation.getTable("positions_table")).waitForExist()
      await (await ShowLocation.getTable("positions_table")).waitForDisplayed()
      expect(
        await ShowLocation.getTableRows("positions_table")
      ).to.have.lengthOf.above(0)
    })
  })

  describe("When on the show page of a location with reports", () => {
    it("We should see rows in the reports table", async() => {
      await ShowLocation.open(LOCATION_WITH_REPORTS_UUID)
      await (await ShowLocation.getReportCollection()).waitForExist()
      await (await ShowLocation.getReportCollection()).waitForDisplayed()
      expect(await ShowLocation.getReportSummaries()).to.have.lengthOf.above(0)

      await ShowLocation.logout()
    })
  })

  describe("When on the show page of a location as admin", () => {
    it("We can select to merge it with another location", async() => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      await (await ShowLocation.getMergeButton()).click()
      await browser.pause(500) // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergeLocations.getTitle()).to.exist
      expect(
        await (await MergeLocations.getLeftLocationField()).getValue()
      ).to.contain("Antarctica")
      // eslint-disable-next-line no-unused-expressions
      expect(await (await MergeLocations.getLeftLocationField()).isEnabled()).to
        .be.false
    })
    it("Should open and close the Edit Engagement planning approvals modal correctly", async() => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      const editButton =
        await ShowLocation.getEditEngagementPlanningApprovalsButton()
      await editButton.waitForExist()
      await editButton.waitForDisplayed()
      await editButton.click()
      const modal = await ShowLocation.getEditApprovalsModal()
      await modal.waitForExist()
      await modal.waitForDisplayed()
      const modalTitle = await modal.$(".modal-title")
      expect(await modalTitle.getText()).to.equal(
        "Edit Engagement planning approval process"
      )
      const closeButton = await ShowLocation.getModalCloseButton()
      await closeButton.click()
      await modal.waitForExist({ reverse: true })
    })
    it("Should open and close the Edit Report publication approvals modal correctly", async() => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      const editButton =
        await ShowLocation.getEditReportPublicationApprovalsButton()
      await editButton.waitForExist()
      await editButton.waitForDisplayed()
      await editButton.click()
      const modal = await ShowLocation.getEditApprovalsModal()
      await modal.waitForExist()
      await modal.waitForDisplayed()
      const modalTitle = await modal.$(".modal-title")
      expect(await modalTitle.getText()).to.equal(
        "Edit Report publication approval process"
      )
      const closeButton = await ShowLocation.getModalCloseButton()
      await closeButton.click()
      await modal.waitForExist({ reverse: true })
    })
  })

  describe("When on the show page of a location with events", () => {
    it("We should see a table with events", async() => {
      await ShowLocation.open(LOCATION_WITH_REPORTS_UUID)
      await (await ShowLocation.getEventsTable()).waitForExist()
      await (await ShowLocation.getEventsTable()).waitForDisplayed()
      expect(await (await ShowLocation.getEventsTable()).getText()).to.contain(
        "NMI PDT 2024-01"
      )
    })
    it("We can go to the show page of event", async() => {
      await (await ShowLocation.getEvent(1)).click()
      await expect(await browser.getUrl()).to.include(
        "/events/e850846e-9741-40e8-bc51-4dccc30cf47f"
      )
    })
  })
})
