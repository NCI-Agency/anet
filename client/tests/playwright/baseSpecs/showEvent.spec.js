import { expect as pwExpect } from "@playwright/test"
import moment from "moment"
import ShowEvent from "../pages/showEvent.page.js"
import { currentPage, test, waitFor } from "../support.js"

const EVENT_UUID = "e850846e-9741-40e8-bc51-4dccc30cf47f" // NMI PDT 2024-01 event
const DATE_FORMAT = "dddd, D MMMM YYYY @ HH:mm"
test.describe("Show event page", () => {
  test("We should see the event data", async () => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await waitFor(await ShowEvent.getTitle(), "attached")
    await waitFor(await ShowEvent.getTitle(), "visible")
    await pwExpect(await ShowEvent.getTitle()).toHaveText(
      "Event NMI PDT 2024-01",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getOwnerOrganization(), "attached")
    await waitFor(await ShowEvent.getOwnerOrganization(), "visible")
    await pwExpect(await ShowEvent.getOwnerOrganization()).toHaveText(
      "EF 2.2",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getHostRelatedObjects(), "attached")
    await waitFor(await ShowEvent.getHostRelatedObjects(), "visible")
    await pwExpect(await ShowEvent.getHostRelatedObjects()).toHaveText(
      "EF 2.2",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getAdminOrganization(), "attached")
    await waitFor(await ShowEvent.getAdminOrganization(), "visible")
    await pwExpect(await ShowEvent.getAdminOrganization()).toHaveText(
      "EF 2.2",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getLocation(), "attached")
    await waitFor(await ShowEvent.getLocation(), "visible")
    await pwExpect(await ShowEvent.getLocation()).toHaveText(
      "General Hospital",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getEventSeries(), "attached")
    await waitFor(await ShowEvent.getEventSeries(), "visible")
    await pwExpect(await ShowEvent.getEventSeries()).toHaveText("NMI PDT", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getType(), "attached")
    await waitFor(await ShowEvent.getType(), "visible")
    await pwExpect(await ShowEvent.getType()).toHaveText("Conference", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getStartDate(), "attached")
    await waitFor(await ShowEvent.getStartDate(), "visible")
    await pwExpect(await ShowEvent.getStartDate()).toHaveText(
      moment.utc("2024-01-08 07:00").local().format(DATE_FORMAT),
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getEndDate(), "attached")
    await waitFor(await ShowEvent.getEndDate(), "visible")
    await pwExpect(await ShowEvent.getEndDate()).toHaveText(
      moment.utc("2024-01-12 17:00").local().format(DATE_FORMAT),
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getStatus(), "attached")
    await waitFor(await ShowEvent.getStatus(), "visible")
    await pwExpect(await ShowEvent.getStatus()).toHaveText("Active", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getDescription(), "attached")
    await waitFor(await ShowEvent.getDescription(), "visible")
    await pwExpect(await ShowEvent.getDescription()).toContainText(
      "NMI pre-deployment training 2024 January",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getOrganizations(), "attached")
    await waitFor(await ShowEvent.getOrganizations(), "visible")
    await pwExpect(await ShowEvent.getOrganizations()).toContainText("EF 2.2", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getPeople(), "attached")
    await waitFor(await ShowEvent.getPeople(), "visible")
    await pwExpect(await ShowEvent.getPeople()).toContainText(
      "CIV Erin Erinson",
      {
        useInnerText: true
      }
    )
    await waitFor(await ShowEvent.getTasks(), "attached")
    await waitFor(await ShowEvent.getTasks(), "visible")
    await pwExpect(await ShowEvent.getTasks()).toContainText("1.2.B", {
      useInnerText: true
    })
    await waitFor(await ShowEvent.getReports(), "attached")
    await waitFor(await ShowEvent.getReports(), "visible")
    await pwExpect(await ShowEvent.getReports()).toContainText(
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
    await waitFor(await ShowEvent.getAttachments(), "attached")
    await waitFor(await ShowEvent.getAttachments(), "visible")
  })
  test("We should see a card of Attachment", async () => {
    await waitFor(await ShowEvent.getCard(), "attached")
    await waitFor(await ShowEvent.getCard(), "visible")
    await pwExpect
      .poll(async () => await ShowEvent.getClassificationLine())
      .toEqual("[Public]")
    await pwExpect
      .poll(async () => await ShowEvent.getCaptionLine())
      .toEqual("456")
  })
  test("We should be able to edit the attachments", async () => {
    const editAttachmentsButton = await ShowEvent.getEditAttachmentsButton()
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
      .toContain("/attachments/426bf11a-5124-4468-8b66-edb3ae130bc0/edit")
    await editAttachmentsButton.click()
  })
  test("We can go to the show page of Attachment", async () => {
    await (await ShowEvent.getImageClick()).click()
    await pwExpect
      .poll(async () => await currentPage().url())
      .toContain("/attachments/426bf11a-5124-4468-8b66-edb3ae130bc0")
  })
})
test.describe("When on the show page of an event with entity avatar", () => {
  test("We should see the avatar", async () => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await waitFor(await ShowEvent.getEntityAvatar(), "attached")
    await waitFor(await ShowEvent.getEntityAvatar(), "visible")
  })
})
