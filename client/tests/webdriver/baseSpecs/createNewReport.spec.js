import { expect } from "chai"
import moment from "moment"
import CreateReport from "../pages/report/createReport.page"
import ShowReport from "../pages/report/showReport.page"

const AUTHOR_NAME = "ERINSON, Erin"
const AUTHOR = `CIV ${AUTHOR_NAME}`
const ADVISOR_NAME = "DVISOR, A"
const ADVISOR = `OF-2 ${ADVISOR_NAME}`
const INTERLOCUTOR_NAME = "STEVESON, Steve"
const INTERLOCUTOR = `OF-4 ${INTERLOCUTOR_NAME}`
const REPORT_FIELDS = {
  intent: "Show attendee positions based on engagement date",
  engagementDate: moment().subtract(1, "day"),
  duration: "60",
  location: "Fort Amherst",
  atmosphere: "Positive",
  advisors: [ADVISOR],
  interlocutors: [INTERLOCUTOR],
  tasks: [{ name: "2.A" }],
  keyOutcomes: "It works",
  nextSteps: "Run some tests",
  reportText:
    "The attendees' positions change based on the engagement date:\n" +
    "- when the engagement is in 2020 the attendees' positions are different from when the engagement is in 2021 or later\n" +
    "- when the engagement is before 2020, none of the attendees have a position\n" +
    "- when saving the report, the advisor organization and interlocutor organization change, based on the primary attendees' current positions"
}
const EXPECTED_DATA = {
  now: {
    positions: {
      author: "EF 2.2 Advisor D",
      advisor: "EF 2.2 Advisor Sewing Facilities",
      interlocutor: "Cost Adder - MoD, MOD-Bud-00003"
    },
    locations: {
      author: "Murray's Hotel",
      advisor: "Murray's Hotel",
      interlocutor: "MoD Headquarters Kabul"
    },
    organizations: {
      author: "EF 2.2",
      advisor: "EF 2.2",
      interlocutor: "MoD | Ministry of Defense"
    }
  },
  in_2020: {
    positions: {
      author: "EF 2.1 Advisor B",
      advisor: "EF 1.2 Advisor",
      interlocutor: "Cost Adder - MoD, MOD-Bud-00003"
    },
    locations: {
      author: "Murray's Hotel",
      advisor: "St Johns Airport",
      interlocutor: "MoD Headquarters Kabul"
    },
    organizations: {
      author: "EF 2.1",
      advisor: "EF 1.2",
      interlocutor: "MoD | Ministry of Defense"
    }
  },
  in_2019: {
    positions: {
      author: "",
      advisor: "",
      interlocutor: ""
    },
    locations: {
      author: "",
      advisor: "",
      interlocutor: ""
    },
    organizations: {
      author: "",
      advisor: "",
      interlocutor: ""
    }
  }
}

async function validateAttendee(name, expectedData, attendeeType) {
  const cols = await CreateReport.getAttendeeColumns(name)
  expect(await (await cols)[3].getText()).to.equal(
    expectedData.positions[attendeeType]
  )
  expect(await (await cols)[4].getText()).to.equal(
    expectedData.locations[attendeeType]
  )
  expect(await (await cols)[5].getText()).to.equal(
    expectedData.organizations[attendeeType]
  )
}

describe("When creating a report", () => {
  let reportUuid
  it("Should show attendee positions at engagement date = now", async() => {
    await CreateReport.open()
    await browser.pause(500) // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    await browser.pause(1000)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.now, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.now, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.now, "interlocutor")
  })

  it("Should switch an attendee between an advisor and interlocutor", async() => {
    const advisor = await CreateReport.getPersonByName(ADVISOR)
    // change attendee to interlocutor
    expect(await advisor.advisorCheckbox.isExisting()).to.equal(true)
    expect(await advisor.advisorCheckbox.isSelected()).to.equal(false)
    advisor.advisorCheckbox.click()
    // wait for the attendee to be moved to the other section
    await browser.pause(500)
    // change attendee to advisor
    expect(await advisor.advisorCheckbox.isExisting()).to.equal(false)
    expect(await advisor.interlocutorCheckbox.isExisting()).to.equal(true)
    expect(await advisor.interlocutorCheckbox.isSelected()).to.equal(true)
    advisor.interlocutorCheckbox.click()
    // wait for the attendee to be moved to the other section
    await browser.pause(500)
    expect(await advisor.interlocutorCheckbox.isExisting()).to.equal(false)
    expect(await advisor.advisorCheckbox.isExisting()).to.equal(true)
    expect(await advisor.advisorCheckbox.isSelected()).to.equal(false)
  })

  it("Should show report with advisor and interlocutor organizations at engagement date = now", async() => {
    await CreateReport.submitForm()
    await browser.pause(1000)
    reportUuid = await ShowReport.getUuid()
    expect(reportUuid.length).to.equal(36)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.now, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.now, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.now, "interlocutor")
    // Validate the organizations
    expect(await ShowReport.getAdvisorOrg()).to.equal(
      EXPECTED_DATA.now.organizations.author
    )
    expect(await ShowReport.getInterlocutorOrg()).to.equal(
      EXPECTED_DATA.now.organizations.interlocutor
    )
  })

  it("Should show attendee positions at engagement date in 2020", async() => {
    // Edit the report
    await (await ShowReport.getEditReportButton()).click()
    // Change the engagement date
    await CreateReport.setEngagementDate(moment("2020-07-01"))
    await browser.pause(1000)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2020, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2020, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2020, "interlocutor")
  })

  it("Should show report with advisor and interlocutor organizations at engagement date in 2020", async() => {
    await CreateReport.submitForm()
    await browser.pause(1000)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2020, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2020, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2020, "interlocutor")
    // Validate the organizations
    expect(await ShowReport.getAdvisorOrg()).to.equal(
      EXPECTED_DATA.in_2020.organizations.author
    )
    expect(await ShowReport.getInterlocutorOrg()).to.equal(
      EXPECTED_DATA.in_2020.organizations.interlocutor
    )
  })

  it("Should show attendee positions at engagement date in 2019", async() => {
    // Edit the report
    await (await ShowReport.getEditReportButton()).click()
    // Change the engagement date
    await CreateReport.setEngagementDate(moment("2019-07-01"))
    await browser.pause(1000)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2019, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2019, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2019, "interlocutor")
  })

  it("Should show report with advisor and interlocutor organizations at engagement date in 2019", async() => {
    await CreateReport.submitForm()
    await browser.pause(1000)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2019, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2019, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2019, "interlocutor")
    // Validate the organizations
    expect(await ShowReport.getAdvisorOrg()).to.equal("Unspecified")
    expect(await ShowReport.getInterlocutorOrg()).to.equal("Unspecified")
  })
})
