import { expect } from "@playwright/test"
import moment from "moment"
import ShowEvent from "../pages/showEvent.page.js"
import { currentPage, test, waitFor } from "../support.js"

const EVENT_UUID = "e850846e-9741-40e8-bc51-4dccc30cf47f" // NMI PDT 2024-01 event
const DATE_FORMAT = "dddd, D MMMM YYYY @ HH:mm"
test.describe("Show event page", () => {
  test("We should see the event data", async () => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await waitFor(await ShowEvent.getTitle(), "visible")
    await expect(await ShowEvent.getTitle()).toHaveText(
      "Event NMI PDT 2024-01",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getOwnerOrganization(), "visible")
    await expect(await ShowEvent.getOwnerOrganization()).toHaveText("EF 2.2", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getHostRelatedObjects(), "visible")
    await expect(await ShowEvent.getHostRelatedObjects()).toHaveText("EF 2.2", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getAdminOrganization(), "visible")
    await expect(await ShowEvent.getAdminOrganization()).toHaveText("EF 2.2", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getLocation(), "visible")
    await expect(await ShowEvent.getLocation()).toHaveText("General Hospital", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getEventSeries(), "visible")
    await expect(await ShowEvent.getEventSeries()).toHaveText("NMI PDT", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getType(), "visible")
    await expect(await ShowEvent.getType()).toHaveText("Conference", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getStartDate(), "visible")
    await expect(await ShowEvent.getStartDate()).toHaveText(
      moment.utc("2024-01-08 07:00").local().format(DATE_FORMAT),
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getEndDate(), "visible")
    await expect(await ShowEvent.getEndDate()).toHaveText(
      moment.utc("2024-01-12 17:00").local().format(DATE_FORMAT),
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getStatus(), "visible")
    await expect(await ShowEvent.getStatus()).toHaveText("Active", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getDescription(), "visible")
    await expect(await ShowEvent.getDescription()).toContainText(
      "NMI pre-deployment training 2024 January",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getOrganizations(), "visible")
    await expect(await ShowEvent.getOrganizations()).toContainText("EF 2.2", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getPeople(), "visible")
    await expect(await ShowEvent.getPeople()).toContainText(
      "CIV Erin Erinson",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getTasks(), "visible")
    await expect(await ShowEvent.getTasks()).toContainText("1.2.B", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getReports(), "visible")
    await expect(await ShowEvent.getReports()).toContainText(
      "Run through FY2016 Numbers on tool usage",
      {
        useInnerText: true
      }
    )
  })
})
test.describe("When on the show page of an event with attachment(s)", () => {
  test("We should see a container for Attachment List", async () => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await waitFor(await ShowEvent.getAttachments(), "visible")
  })
  test("We should see a card of Attachment", async () => {
    await waitFor(await ShowEvent.getCard(), "visible")
    await expect(await ShowEvent.getClassificationLine()).toHaveText(
      "[Public]",
      { useInnerText: true }
    )
    await expect(await ShowEvent.getCaptionLine()).toHaveText("456", {
      useInnerText: true
    })
  })
  test("We should be able to edit the attachments", async () => {
    const editAttachmentsButton = await ShowEvent.getEditAttachmentsButton()
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
      /\/attachments\/426bf11a-5124-4468-8b66-edb3ae130bc0\/edit/
    )
    await editAttachmentsButton.click()
  })
  test("We can go to the show page of Attachment", async () => {
    await (await ShowEvent.getImageClick()).click()
    await expect(currentPage()).toHaveURL(
      /\/attachments\/426bf11a-5124-4468-8b66-edb3ae130bc0/
    )
  })
})
test.describe("When on the show page of an event with entity avatar", () => {
  test("We should see the avatar", async () => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await waitFor(await ShowEvent.getEntityAvatar(), "visible")
  })
})
