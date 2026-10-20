import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import ShowLocation from "../pages/location/showLocation.page.js"
import MergeLocations from "../pages/mergeLocations.page.js"
import { currentPage, test, waitFor } from "../support.js"

const LOCATION_WITH_ATTACHMENTS_UUID = "e5b3a4b9-acf7-4c79-8224-f248b9a7215d" // Antarctica
const LOCATION_WITH_ORGANIZATIONS_UUID = "9c982685-5946-4dad-a7ee-0f5a12f5e170" // Wishingwells Park
const LOCATION_WITH_POSITIONS_UUID = "cc49bb27-4d8f-47a8-a9ee-af2b68b992ac" // St Johns Airport
const LOCATION_WITH_REPORTS_UUID = "0855fb0a-995e-4a79-a132-4024ee2983ff" // General Hospital

test.describe("Show location page", () => {
  test.describe("When on the show page of a location with attachment(s)", () => {
    test("We should see a container for Attachment List", async () => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      await waitFor(await ShowLocation.getAttachments(), "attached")
      await waitFor(await ShowLocation.getAttachments(), "visible")
    })
    test("We should see a card of Attachment", async () => {
      await waitFor(await ShowLocation.getCard(), "attached")
      await waitFor(await ShowLocation.getCard(), "visible")
      await pwExpect
        .poll(async () => await ShowLocation.getClassificationLine())
        .toEqual("[NATO UNCLASSIFIED Releasable to EU]")
      await pwExpect
        .poll(async () => await ShowLocation.getCaptionLine())
        .toEqual("Antarctica")
    })
    test("We should be able to edit the attachments", async () => {
      const editAttachmentsButton =
        await ShowLocation.getEditAttachmentsButton()
      await pwExpect(editAttachmentsButton).toHaveText("Edit attachments", {
        useInnerText: true
      })
      await editAttachmentsButton.click()
      await pwExpect(editAttachmentsButton).toHaveText("View attachments", {
        useInnerText: true
      })
      const editButton = await currentPage()
        .locator(".attachment-card .button-line a")
        .first()
      await pwExpect
        .poll(async () => await editButton.getAttribute("href"))
        .toContain("/attachments/f7cd5b02-ef73-4ee8-814b-c5a7a916685d/edit")
      await editAttachmentsButton.click()
    })
    test("We can go to the show page of Attachment", async () => {
      await (await ShowLocation.getImageClick()).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/attachments/f7cd5b02-ef73-4ee8-814b-c5a7a916685d")
    })
  })
  test.describe("When on the show page of an location with entity avatar", () => {
    test("We should see the avatar", async () => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      await waitFor(await ShowLocation.getEntityAvatar(), "attached")
      await waitFor(await ShowLocation.getEntityAvatar(), "visible")
    })
  })
  test.describe("When on the show page of a location with organizations", () => {
    test("We should see rows in the organizations table", async () => {
      await ShowLocation.open(LOCATION_WITH_ORGANIZATIONS_UUID)
      await waitFor(
        await ShowLocation.getTable("organizations_table"),
        "attached"
      )
      await waitFor(
        await ShowLocation.getTable("organizations_table"),
        "visible"
      )
      await pwExpect
        .poll(
          async () =>
            (await ShowLocation.getTableRows("organizations_table")).length
        )
        .toBeGreaterThan(0)
    })
  })
  test.describe("When on the show page of a location with positions", () => {
    test("We should see rows in the positions table", async () => {
      await ShowLocation.open(LOCATION_WITH_POSITIONS_UUID)
      await waitFor(await ShowLocation.getTable("positions_table"), "attached")
      await waitFor(await ShowLocation.getTable("positions_table"), "visible")
      await pwExpect
        .poll(
          async () =>
            (await ShowLocation.getTableRows("positions_table")).length
        )
        .toBeGreaterThan(0)
    })
  })
  test.describe("When on the show page of a location with reports", () => {
    test("We should see rows in the reports table", async () => {
      await ShowLocation.open(LOCATION_WITH_REPORTS_UUID)
      await waitFor(await ShowLocation.getReportCollection(), "attached")
      await waitFor(await ShowLocation.getReportCollection(), "visible")
      await pwExpect
        .poll(async () => (await ShowLocation.getReportSummaries()).length)
        .toBeGreaterThan(0)
      await ShowLocation.logout()
    })
  })
  test.describe("When on the show page of a location as admin", () => {
    test("We can select to merge it with another location", async () => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      await (await ShowLocation.getMergeButton()).click()
      // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergeLocations.getTitle()).to.exist
      await pwExpect
        .poll(
          async () =>
            await (await MergeLocations.getLeftLocationField()).inputValue()
        )
        .toContain("Antarctica")
      await pwExpect(
        await MergeLocations.getLeftLocationField()
      ).not.toBeEnabled()
    })
    test("Should open and close the Edit Engagement planning approvals modal correctly", async () => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      const editButton =
        await ShowLocation.getEditEngagementPlanningApprovalsButton()
      await waitFor(editButton, "attached")
      await waitFor(editButton, "visible")
      await editButton.click()
      const modal = await ShowLocation.getEditApprovalsModal()
      await waitFor(modal, "attached")
      await waitFor(modal, "visible")
      const modalTitle = await modal.locator(".modal-title").first()
      await pwExpect(modalTitle).toHaveText(
        "Edit Engagement planning approval process",
        {
          useInnerText: true
        }
      )
      const closeButton = await ShowLocation.getModalCloseButton()
      await closeButton.click()
      await waitFor(modal, "attached", {
        reverse: true
      })
    })
    test("Should open and close the Edit Report publication approvals modal correctly", async () => {
      await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
      const editButton =
        await ShowLocation.getEditReportPublicationApprovalsButton()
      await waitFor(editButton, "attached")
      await waitFor(editButton, "visible")
      await editButton.click()
      const modal = await ShowLocation.getEditApprovalsModal()
      await waitFor(modal, "attached")
      await waitFor(modal, "visible")
      const modalTitle = await modal.locator(".modal-title").first()
      await pwExpect(modalTitle).toHaveText(
        "Edit Report publication approval process",
        {
          useInnerText: true
        }
      )
      const closeButton = await ShowLocation.getModalCloseButton()
      await closeButton.click()
      await waitFor(modal, "attached", {
        reverse: true
      })
    })
  })
  test.describe("When on the show page of a location with events", () => {
    test("We should see a table with events", async () => {
      await ShowLocation.open(LOCATION_WITH_REPORTS_UUID)
      await waitFor(await ShowLocation.getEventsTable(), "attached")
      await waitFor(await ShowLocation.getEventsTable(), "visible")
      await pwExpect(await ShowLocation.getEventsTable()).toContainText(
        "NMI PDT 2024-01",
        {
          useInnerText: true
        }
      )
    })
    test("We can go to the show page of event", async () => {
      await (await ShowLocation.getEvent(1)).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/events/e850846e-9741-40e8-bc51-4dccc30cf47f")
    })
  })
})
