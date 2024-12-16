import { expect } from "chai"
import ShowEventSeries from "../pages/showEventSeries.page"

const EVENT_SERIES_UUID = "b7b70191-54e4-462f-8e40-679dd2e71ec4" // NMI PDT event series

describe("Show event series page", () => {
  it("We should see the event series data ", async() => {
    await ShowEventSeries.openAsAdminUser(EVENT_SERIES_UUID)
    await (await ShowEventSeries.getTitle()).waitForExist()
    await (await ShowEventSeries.getTitle()).waitForDisplayed()
    expect(await (await ShowEventSeries.getTitle()).getText()).to.equal(
      "Event Series NMI PDT"
    )
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
    await (await ShowEventSeries.getEvent(1)).click()
    expect(await browser.getUrl()).to.include(
      "/events/e850846e-9741-40e8-bc51-4dccc30cf47f"
    )
  })
})
