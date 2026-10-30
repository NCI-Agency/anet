import { expect, test } from "@playwright/test"
import ShowLocationPageObject from "../pages/location/showLocation.page.js"
import MergeLocationsPageObject from "../pages/mergeLocations.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, ShowLocation, MergeLocations
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    ShowLocation = new ShowLocationPageObject(page)
    MergeLocations = new MergeLocationsPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const LOCATION_WITH_ATTACHMENTS_UUID = "e5b3a4b9-acf7-4c79-8224-f248b9a7215d" // Antarctica
  const LOCATION_WITH_ORGANIZATIONS_UUID =
    "9c982685-5946-4dad-a7ee-0f5a12f5e170" // Wishingwells Park
  const LOCATION_WITH_POSITIONS_UUID = "cc49bb27-4d8f-47a8-a9ee-af2b68b992ac" // St Johns Airport
  const LOCATION_WITH_REPORTS_UUID = "0855fb0a-995e-4a79-a132-4024ee2983ff" // General Hospital

  test.describe("Show location page", () => {
    test.describe("When on the show page of a location with attachment(s)", () => {
      test("We should see a container for Attachment List", async () => {
        await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
        await (
          await ShowLocation.getAttachments()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
      test("We should see a card of Attachment", async () => {
        await (
          await ShowLocation.getCard()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await ShowLocation.getClassificationLine()).toHaveText(
          "[NATO UNCLASSIFIED Releasable to EU]",
          {
            useInnerText: true
          }
        )
        await expect(await ShowLocation.getCaptionLine()).toHaveText(
          "Antarctica",
          {
            useInnerText: true
          }
        )
      })
      test("We should be able to edit the attachments", async () => {
        const editAttachmentsButton =
          await ShowLocation.getEditAttachmentsButton()
        await expect(editAttachmentsButton).toHaveText("Edit attachments", {
          useInnerText: true
        })
        await editAttachmentsButton.click()
        await expect(editAttachmentsButton).toHaveText("View attachments", {
          useInnerText: true
        })
        const editButton = await page
          .locator(".attachment-card .button-line a")
          .first()
        await expect(editButton).toHaveAttribute(
          "href",
          /\/attachments\/f7cd5b02-ef73-4ee8-814b-c5a7a916685d\/edit/
        )
        await editAttachmentsButton.click()
      })
      test("We can go to the show page of Attachment", async () => {
        await (await ShowLocation.getImageClick()).click()
        await expect(page).toHaveURL(
          /\/attachments\/f7cd5b02-ef73-4ee8-814b-c5a7a916685d/
        )
      })
    })
    test.describe("When on the show page of an location with entity avatar", () => {
      test("We should see the avatar", async () => {
        await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
        await (
          await ShowLocation.getEntityAvatar()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
    })
    test.describe("When on the show page of a location with organizations", () => {
      test("We should see rows in the organizations table", async () => {
        await ShowLocation.open(LOCATION_WITH_ORGANIZATIONS_UUID)
        await (
          await ShowLocation.getTable("organizations_table")
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(
          await ShowLocation.getTableRows("organizations_table")
        ).not.toHaveCount(0)
      })
    })
    test.describe("When on the show page of a location with positions", () => {
      test("We should see rows in the positions table", async () => {
        await ShowLocation.open(LOCATION_WITH_POSITIONS_UUID)
        await (
          await ShowLocation.getTable("positions_table")
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(
          await ShowLocation.getTableRows("positions_table")
        ).not.toHaveCount(0)
      })
    })
    test.describe("When on the show page of a location with reports", () => {
      test("We should see rows in the reports table", async () => {
        await ShowLocation.open(LOCATION_WITH_REPORTS_UUID)
        await (
          await ShowLocation.getReportCollection()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await ShowLocation.getReportSummaries()).not.toHaveCount(0)
        await ShowLocation.logout()
      })
    })
    test.describe("When on the show page of a location as admin", () => {
      test("We can select to merge it with another location", async () => {
        await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
        await (await ShowLocation.getMergeButton()).click()
        // wait for the merge page to render and load data
        await expect(await MergeLocations.getTitle()).toBeVisible()
        await expect(await MergeLocations.getLeftLocationField()).toHaveValue(
          /Antarctica/
        )
        await expect(
          await MergeLocations.getLeftLocationField()
        ).not.toBeEnabled()
      })
      test("Should open and close the Edit Engagement planning approvals modal correctly", async () => {
        await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
        const editButton =
          await ShowLocation.getEditEngagementPlanningApprovalsButton()
        await editButton.click()
        const modal = await ShowLocation.getEditApprovalsModal()
        await modal.waitFor({
          state: "visible",
          timeout: 10000
        })
        const modalTitle = await modal.locator(".modal-title").first()
        await expect(modalTitle).toHaveText(
          "Edit Engagement planning approval process",
          {
            useInnerText: true
          }
        )
        const closeButton = await ShowLocation.getModalCloseButton()
        await closeButton.click()
        await modal.waitFor({
          state: "detached",
          timeout: 10000
        })
      })
      test("Should open and close the Edit Report publication approvals modal correctly", async () => {
        await ShowLocation.openAsAdminUser(LOCATION_WITH_ATTACHMENTS_UUID)
        const editButton =
          await ShowLocation.getEditReportPublicationApprovalsButton()
        await editButton.click()
        const modal = await ShowLocation.getEditApprovalsModal()
        await modal.waitFor({
          state: "visible",
          timeout: 10000
        })
        const modalTitle = await modal.locator(".modal-title").first()
        await expect(modalTitle).toHaveText(
          "Edit Report publication approval process",
          {
            useInnerText: true
          }
        )
        const closeButton = await ShowLocation.getModalCloseButton()
        await closeButton.click()
        await modal.waitFor({
          state: "detached",
          timeout: 10000
        })
      })
    })
    test.describe("When on the show page of a location with events", () => {
      test("We should see a table with events", async () => {
        await ShowLocation.open(LOCATION_WITH_REPORTS_UUID)
        await (
          await ShowLocation.getEventsTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await ShowLocation.getEventsTable()).toContainText(
          "NMI PDT 2024-01",
          {
            useInnerText: true
          }
        )
      })
      test("We can go to the show page of event", async () => {
        await (await ShowLocation.getEvent(1)).click()
        await expect(page).toHaveURL(
          /\/events\/e850846e-9741-40e8-bc51-4dccc30cf47f/
        )
      })
    })
  })
})
