import { expect } from "chai"
import moment from "moment"
import ShowEvent from "../pages/showEvent.page"

const EVENT_UUID = "e850846e-9741-40e8-bc51-4dccc30cf47f" // NMI PDT 2024-01 event
const DATE_FORMAT = "dddd, D MMMM YYYY @ HH:mm"

describe("Show event page", () => {
  it("We should see the event data", async() => {
    await ShowEvent.openAsAdminUser(EVENT_UUID)
    await (await ShowEvent.getTitle()).waitForExist()
    await (await ShowEvent.getTitle()).waitForDisplayed()
    expect(await (await ShowEvent.getTitle()).getText()).to.equal(
      "Event NMI PDT 2024-01"
    )
    await (await ShowEvent.getOwnerOrganization()).waitForExist()
    await (await ShowEvent.getOwnerOrganization()).waitForDisplayed()
    expect(await (await ShowEvent.getOwnerOrganization()).getText()).to.equal(
      "EF 2.2"
    )
    await (await ShowEvent.getHostOrganization()).waitForExist()
    await (await ShowEvent.getHostOrganization()).waitForDisplayed()
    expect(await (await ShowEvent.getHostOrganization()).getText()).to.equal(
      "EF 2.2"
    )
    await (await ShowEvent.getAdminOrganization()).waitForExist()
    await (await ShowEvent.getAdminOrganization()).waitForDisplayed()
    expect(await (await ShowEvent.getAdminOrganization()).getText()).to.equal(
      "EF 2.2"
    )
    await (await ShowEvent.getLocation()).waitForExist()
    await (await ShowEvent.getLocation()).waitForDisplayed()
    expect(await (await ShowEvent.getLocation()).getText()).to.equal(
      "General Hospital 47.571772,-52.741935"
    )
    await (await ShowEvent.getEventSeries()).waitForExist()
    await (await ShowEvent.getEventSeries()).waitForDisplayed()
    expect(await (await ShowEvent.getEventSeries()).getText()).to.equal(
      "NMI PDT"
    )
    await (await ShowEvent.getType()).waitForExist()
    await (await ShowEvent.getType()).waitForDisplayed()
    expect(await (await ShowEvent.getType()).getText()).to.equal("Conference")
    await (await ShowEvent.getStartDate()).waitForExist()
    await (await ShowEvent.getStartDate()).waitForDisplayed()
    expect(await (await ShowEvent.getStartDate()).getText()).to.equal(
      moment.utc("2024-01-08 07:00").local().format(DATE_FORMAT)
    )
    await (await ShowEvent.getEndDate()).waitForExist()
    await (await ShowEvent.getEndDate()).waitForDisplayed()
    expect(await (await ShowEvent.getEndDate()).getText()).to.equal(
      moment.utc("2024-01-12 17:00").local().format(DATE_FORMAT)
    )
    await (await ShowEvent.getStatus()).waitForExist()
    await (await ShowEvent.getStatus()).waitForDisplayed()
    expect(await (await ShowEvent.getStatus()).getText()).to.equal("Active")
    await (await ShowEvent.getDescription()).waitForExist()
    await (await ShowEvent.getDescription()).waitForDisplayed()
    expect(await (await ShowEvent.getDescription()).getText()).to.include(
      "NMI pre-deployment training 2024 January"
    )
    await (await ShowEvent.getOrganizations()).waitForExist()
    await (await ShowEvent.getOrganizations()).waitForDisplayed()
    expect(await (await ShowEvent.getOrganizations()).getText()).to.include(
      "EF 2.2"
    )
    await (await ShowEvent.getPeople()).waitForExist()
    await (await ShowEvent.getPeople()).waitForDisplayed()
    expect(await (await ShowEvent.getPeople()).getText()).to.include(
      "CIV ERINSON, Erin"
    )
    await (await ShowEvent.getTasks()).waitForExist()
    await (await ShowEvent.getTasks()).waitForDisplayed()
    expect(await (await ShowEvent.getTasks()).getText()).to.include("1.2.B")
    await (await ShowEvent.getReports()).waitForExist()
    await (await ShowEvent.getReports()).waitForDisplayed()
    expect(await (await ShowEvent.getReports()).getText()).to.include(
      "Run through FY2016 Numbers on tool usage"
    )
  })
})
