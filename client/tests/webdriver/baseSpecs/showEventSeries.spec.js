import { expect } from "chai"
import ShowEventSeries from "../pages/showEventSeries.page"

const EVENT_SERIES_UUID = "b7b70191-54e4-462f-8e40-679dd2e71ec4" // NMI PDT event series

describe("Show event series page", () => {
  it("We should see the event series data ", async () => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await (await ShowEventSeries.getTitle()).waitForExist()
    await (await ShowEventSeries.getTitle()).waitForDisplayed()
    expect(await (await ShowEventSeries.getTitle()).getText()).to.equal(
      "Event Series NMI PDT"
    )
    await (await ShowEventSeries.getOwnerOrganization()).waitForExist()
    await (await ShowEventSeries.getOwnerOrganization()).waitForDisplayed()
    expect(
      await (await ShowEventSeries.getOwnerOrganization()).getText()
    ).to.equal("EF 2.2")
    await (await ShowEventSeries.getHostOrganization()).waitForExist()
    await (await ShowEventSeries.getHostOrganization()).waitForDisplayed()
    expect(
      await (await ShowEventSeries.getHostOrganization()).getText()
    ).to.equal("EF 2.2")
    await (await ShowEventSeries.getAdminOrganization()).waitForExist()
    await (await ShowEventSeries.getAdminOrganization()).waitForDisplayed()
    expect(
      await (await ShowEventSeries.getAdminOrganization()).getText()
    ).to.equal("EF 2.2")
    await (await ShowEventSeries.getStatus()).waitForExist()
    await (await ShowEventSeries.getStatus()).waitForDisplayed()
    expect(await (await ShowEventSeries.getStatus()).getText()).to.equal(
      "Active"
    )
    await (await ShowEventSeries.getDescription()).waitForExist()
    await (await ShowEventSeries.getDescription()).waitForDisplayed()
    expect(await (await ShowEventSeries.getDescription()).getText()).to.include(
      "NMI pre-deployment training"
    )
    await (await ShowEventSeries.getEventsTable()).waitForExist()
    await (await ShowEventSeries.getEventsTable()).waitForDisplayed()
    expect(await (await ShowEventSeries.getEventsTable()).getText()).to.include(
      "NMI PDT 2024-01"
    )
    await (await ShowEventSeries.getEvent(3)).click()
    expect(await browser.getUrl()).to.include(
      "/events/e850846e-9741-40e8-bc51-4dccc30cf47f"
    )
  })
})
describe("When on the show page of an event series with attachment(s)", () => {
  it("We should see a container for Attachment List", async () => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await (await ShowEventSeries.getAttachments()).waitForExist()
    await (await ShowEventSeries.getAttachments()).waitForDisplayed()
  })
  it("We should see a card of Attachment", async () => {
    await (await ShowEventSeries.getCard()).waitForExist()
    await (await ShowEventSeries.getCard()).waitForDisplayed()
    expect(await ShowEventSeries.getCaption()).to.be.equal("123")
  })
  it("We should be able to edit the attachments", async () => {
    const editAttachmentsButton =
      await ShowEventSeries.getEditAttachmentsButton()
    expect(await editAttachmentsButton.getText()).to.be.equal(
      "Edit attachments"
    )
    await editAttachmentsButton.click()
    expect(await editAttachmentsButton.getText()).to.be.equal(
      "View attachments"
    )

    const editButton = await browser.$(".attachment-card .button-line a")
    await expect(await editButton.getAttribute("href")).to.include(
      "/attachments/0df946d2-d565-4234-8c0d-0b30f486aacc/edit"
    )
    await editAttachmentsButton.click()
  })
  it("We can go to the show page of Attachment", async () => {
    await (await ShowEventSeries.getImageClick()).click()
    await expect(await browser.getUrl()).to.include(
      "/attachments/0df946d2-d565-4234-8c0d-0b30f486aacc"
    )
  })
})
describe("When on the show page of an event with entity avatar", () => {
  it("We should see the avatar", async () => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await (await ShowEventSeries.getEntityAvatar()).waitForExist()
    await (await ShowEventSeries.getEntityAvatar()).waitForDisplayed()
  })
})
