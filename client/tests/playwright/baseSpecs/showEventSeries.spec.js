import { expect } from "@playwright/test"
import ShowEventSeries from "../pages/showEventSeries.page.js"
import { currentPage, test, waitFor } from "../support.js"

const EVENT_SERIES_UUID = "b7b70191-54e4-462f-8e40-679dd2e71ec4" // NMI PDT event series

test.describe("Show event series page", () => {
  test("We should see the event series data ", async () => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await waitFor(await ShowEventSeries.getTitle(), "visible")
    await expect(await ShowEventSeries.getTitle()).toHaveText(
      "Event Series NMI PDT",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEventSeries.getOwnerOrganization(), "visible")
    await expect(await ShowEventSeries.getOwnerOrganization()).toHaveText(
      "EF 2.2",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEventSeries.getHostRelatedObjects(), "visible")
    await expect(await ShowEventSeries.getHostRelatedObjects()).toHaveText(
      "EF 2.2",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEventSeries.getAdminOrganization(), "visible")
    await expect(await ShowEventSeries.getAdminOrganization()).toHaveText(
      "EF 2.2",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEventSeries.getStatus(), "visible")
    await expect(await ShowEventSeries.getStatus()).toHaveText("Active", {
      useInnerText: true
    })
    await waitFor(await ShowEventSeries.getDescription(), "visible")
    await expect(await ShowEventSeries.getDescription()).toContainText(
      "NMI pre-deployment training",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEventSeries.getEventsTable(), "visible")
    await expect(await ShowEventSeries.getEventsTable()).toContainText(
      "NMI PDT 2024-01",
      {
        useInnerText: true
      }
    )
    await (await ShowEventSeries.getEvent(3)).click()
    await expect(currentPage()).toHaveURL(
      /\/events\/e850846e-9741-40e8-bc51-4dccc30cf47f/
    )
  })
})
test.describe("When on the show page of an event series with attachment(s)", () => {
  test("We should see a container for Attachment List", async () => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await waitFor(await ShowEventSeries.getAttachments(), "visible")
  })
  test("We should see a card of Attachment", async () => {
    await waitFor(await ShowEventSeries.getCard(), "visible")
    await expect(await ShowEventSeries.getClassificationLine()).toHaveText(
      "[Public]",
      { useInnerText: true }
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
    const editButton = await currentPage()
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
    await expect(currentPage()).toHaveURL(
      /\/attachments\/0df946d2-d565-4234-8c0d-0b30f486aacc/
    )
  })
})
test.describe("When on the show page of an event with entity avatar", () => {
  test("We should see the avatar", async () => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await waitFor(await ShowEventSeries.getEntityAvatar(), "visible")
  })
})
