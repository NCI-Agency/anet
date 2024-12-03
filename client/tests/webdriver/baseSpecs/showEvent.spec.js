import { expect } from "chai"
import ShowEvent from "../pages/showEvent.page"

const EVENT_UUID = "e850846e-9741-40e8-bc51-4dccc30cf47f" // NMI PDT 2024-01 event

describe("Show event page", () => {
  it("We should see the event data", async() => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await (await ShowEvent.getTitle()).waitForExist()
    await (await ShowEvent.getTitle()).waitForDisplayed()
    expect(await (await ShowEvent.getTitle()).getText()).to.contain(
      "NMI PDT 2024-01"
    )
    await (await ShowEvent.getHostOrganization()).waitForExist()
    await (await ShowEvent.getHostOrganization()).waitForDisplayed()
    expect(await (await ShowEvent.getHostOrganization()).getText()).to.contain(
      "EF 2.2"
    )
    await (await ShowEvent.getAdminOrganization()).waitForExist()
    await (await ShowEvent.getAdminOrganization()).waitForDisplayed()
    expect(await (await ShowEvent.getAdminOrganization()).getText()).to.contain(
      "EF 2.2"
    )
    await (await ShowEvent.getLocation()).waitForExist()
    await (await ShowEvent.getLocation()).waitForDisplayed()
    expect(await (await ShowEvent.getLocation()).getText()).to.contain(
      "General Hospital"
    )
    await (await ShowEvent.getEventSeries()).waitForExist()
    await (await ShowEvent.getEventSeries()).waitForDisplayed()
    expect(await (await ShowEvent.getEventSeries()).getText()).to.contain(
      "NMI PDT"
    )
    await (await ShowEvent.getType()).waitForExist()
    await (await ShowEvent.getType()).waitForDisplayed()
    expect(await (await ShowEvent.getType()).getText()).to.contain("Conference")
    await (await ShowEvent.getStartDate()).waitForExist()
    await (await ShowEvent.getStartDate()).waitForDisplayed()
    expect(await (await ShowEvent.getStartDate()).getText()).to.contain(
      "Start Date"
    )
    await (await ShowEvent.getEndDate()).waitForExist()
    await (await ShowEvent.getEndDate()).waitForDisplayed()
    expect(await (await ShowEvent.getEndDate()).getText()).to.contain(
      "End Date"
    )
    await (await ShowEvent.getDescription()).waitForExist()
    await (await ShowEvent.getDescription()).waitForDisplayed()
    expect(await (await ShowEvent.getDescription()).getText()).to.contain(
      "NMI pre-deployment training 2024 January"
    )
    await (await ShowEvent.getOrganizations()).waitForExist()
    await (await ShowEvent.getOrganizations()).waitForDisplayed()
    expect(await (await ShowEvent.getOrganizations()).getText()).to.contain(
      "EF 2.2"
    )
    await (await ShowEvent.getPeople()).waitForExist()
    await (await ShowEvent.getPeople()).waitForDisplayed()
    expect(await (await ShowEvent.getPeople()).getText()).to.contain("ERINSON")
    await (await ShowEvent.getTasks()).waitForExist()
    await (await ShowEvent.getTasks()).waitForDisplayed()
    expect(await (await ShowEvent.getTasks()).getText()).to.contain("1.2.B")
    await (await ShowEvent.getReports()).waitForExist()
    await (await ShowEvent.getReports()).waitForDisplayed()
    expect(await (await ShowEvent.getReports()).getText()).to.contain(
      "Run through FY2016 Numbers on tool usage"
    )
  })
})
