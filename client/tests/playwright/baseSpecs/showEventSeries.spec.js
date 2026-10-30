import { expect, test } from "@playwright/test"
import ShowEventSeriesPageObject from "../pages/showEventSeries.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, ShowEventSeries
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    ShowEventSeries = new ShowEventSeriesPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const EVENT_SERIES_UUID = "b7b70191-54e4-462f-8e40-679dd2e71ec4" // NMI PDT event series

  test.describe("Show event series page", () => {
    test("We should see the event series data ", async () => {
      await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
      await (
        await ShowEventSeries.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getTitle()).toHaveText(
        "Event Series NMI PDT",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEventSeries.getOwnerOrganization()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getOwnerOrganization()).toHaveText(
        "EF 2.2",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEventSeries.getHostRelatedObjects()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getHostRelatedObjects()).toHaveText(
        "EF 2.2",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEventSeries.getAdminOrganization()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getAdminOrganization()).toHaveText(
        "EF 2.2",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEventSeries.getStatus()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getStatus()).toHaveText("Active", {
        useInnerText: true
      })
      await (
        await ShowEventSeries.getDescription()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getDescription()).toContainText(
        "NMI pre-deployment training",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEventSeries.getEventsTable()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getEventsTable()).toContainText(
        "NMI PDT 2024-01",
        {
          useInnerText: true
        }
      )
      await (await ShowEventSeries.getEvent(3)).click()
      await expect(page).toHaveURL(
        /\/events\/e850846e-9741-40e8-bc51-4dccc30cf47f/
      )
    })
  })
  test.describe("When on the show page of an event series with attachment(s)", () => {
    test("We should see a container for Attachment List", async () => {
      await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
      await (
        await ShowEventSeries.getAttachments()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("We should see a card of Attachment", async () => {
      await (
        await ShowEventSeries.getCard()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await expect(await ShowEventSeries.getClassificationLine()).toHaveText(
        "[Public]",
        {
          useInnerText: true
        }
      )
      await expect(await ShowEventSeries.getCaptionLine()).toHaveText("123", {
        useInnerText: true
      })
    })
    test("We should be able to edit the attachments", async () => {
      const editAttachmentsButton =
        await ShowEventSeries.getEditAttachmentsButton()
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
        /\/attachments\/0df946d2-d565-4234-8c0d-0b30f486aacc\/edit/
      )
      await editAttachmentsButton.click()
    })
    test("We can go to the show page of Attachment", async () => {
      await (await ShowEventSeries.getImageClick()).click()
      await expect(page).toHaveURL(
        /\/attachments\/0df946d2-d565-4234-8c0d-0b30f486aacc/
      )
    })
  })
  test.describe("When on the show page of an event with entity avatar", () => {
    test("We should see the avatar", async () => {
      await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
      await (
        await ShowEventSeries.getEntityAvatar()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
  })
})
