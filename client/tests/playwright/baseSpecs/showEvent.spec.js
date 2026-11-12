import { expect, test } from "@playwright/test"
import moment from "moment"
import ShowEventPageObject from "../pages/showEvent.page.js"

test.describe(() => {
  let page, ShowEvent
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    ShowEvent = new ShowEventPageObject(page)
  })
  const EVENT_UUID = "e850846e-9741-40e8-bc51-4dccc30cf47f" // NMI PDT 2024-01 event
  const DATE_FORMAT = "dddd, D MMMM YYYY @ HH:mm"
  test.describe("Show event page", () => {
    test("We should see the event data", async () => {
      await ShowEvent.openAsAdminUser(EVENT_UUID)
      await (
        await ShowEvent.getTitle()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getTitle()).toHaveText(
        "Event NMI PDT 2024-01",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getOwnerOrganization()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getOwnerOrganization()).toHaveText(
        "EF 2.2",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getHostRelatedObjects()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getHostRelatedObjects()).toHaveText(
        "EF 2.2",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getAdminOrganization()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getAdminOrganization()).toHaveText(
        "EF 2.2",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getLocation()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getLocation()).toHaveText(
        "General Hospital",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getEventSeries()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getEventSeries()).toHaveText("NMI PDT", {
        useInnerText: true
      })
      await (
        await ShowEvent.getType()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getType()).toHaveText("Conference", {
        useInnerText: true
      })
      await (
        await ShowEvent.getStartDate()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getStartDate()).toHaveText(
        moment.utc("2024-01-08 07:00").local().format(DATE_FORMAT),
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getEndDate()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getEndDate()).toHaveText(
        moment.utc("2024-01-12 17:00").local().format(DATE_FORMAT),
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getStatus()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getStatus()).toHaveText("Active", {
        useInnerText: true
      })
      await (
        await ShowEvent.getDescription()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getDescription()).toContainText(
        "NMI pre-deployment training 2024 January",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getOrganizations()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getOrganizations()).toContainText("EF 2.2", {
        useInnerText: true
      })
      await (
        await ShowEvent.getPeople()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getPeople()).toContainText(
        "CIV Erin Erinson",
        {
          useInnerText: true
        }
      )
      await (
        await ShowEvent.getTasks()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getTasks()).toContainText("1.2.B", {
        useInnerText: true
      })
      await (
        await ShowEvent.getReports()
      ).waitFor({
        state: "visible"
      })
      await expect(await ShowEvent.getReports()).toContainText(
        "Run through FY2016 Numbers on tool usage",
        {
          useInnerText: true
        }
      )
    })
  })
  test("When on the show page of an event with attachment(s)", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 4)

    await test.step(
      "We should see a container for Attachment List",
      async () => {
        await ShowEvent.openAsAdminUser(EVENT_UUID)
        await (
          await ShowEvent.getAttachments()
        ).waitFor({
          state: "visible"
        })
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "We should see a card of Attachment",
      async () => {
        await (
          await ShowEvent.getCard()
        ).waitFor({
          state: "visible"
        })
        await expect(await ShowEvent.getClassificationLine()).toHaveText(
          "[Public]",
          {
            useInnerText: true
          }
        )
        await expect(await ShowEvent.getCaptionLine()).toHaveText("456", {
          useInnerText: true
        })
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "We should be able to edit the attachments",
      async () => {
        const editAttachmentsButton = await ShowEvent.getEditAttachmentsButton()
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
          /\/attachments\/426bf11a-5124-4468-8b66-edb3ae130bc0\/edit/
        )
        await editAttachmentsButton.click()
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "We can go to the show page of Attachment",
      async () => {
        await (await ShowEvent.getImageClick()).click()
        await expect(page).toHaveURL(
          /\/attachments\/426bf11a-5124-4468-8b66-edb3ae130bc0/
        )
      },
      { timeout: stepTimeout }
    )
  })
  test.describe("When on the show page of an event with entity avatar", () => {
    test("We should see the avatar", async () => {
      await ShowEvent.openAsAdminUser(EVENT_UUID)
      await (
        await ShowEvent.getEntityAvatar()
      ).waitFor({
        state: "visible"
      })
    })
  })
})
