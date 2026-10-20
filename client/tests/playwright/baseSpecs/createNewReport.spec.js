import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import moment from "moment"
import CreateReport from "../pages/report/createReport.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import { currentPage, test } from "../support.js"

const AUTHOR_NAME = "Erin Erinson"
const AUTHOR = `CIV ${AUTHOR_NAME}`
const ADVISOR_NAME = "A Dvisor"
const ADVISOR = `OF-2 ${ADVISOR_NAME}`
const INTERLOCUTOR_NAME = "Steve Steveson"
const INTERLOCUTOR = `OF-4 ${INTERLOCUTOR_NAME}`
const REPORT_FIELDS = {
  intent: "Show attendee positions based on engagement date",
  engagementDate: moment().subtract(1, "day"),
  duration: "60",
  location: "Fort Amherst",
  atmosphere: "Positive",
  reportCommunities: ["EF 1.1", "EF 5"],
  advisors: [ADVISOR],
  interlocutors: [INTERLOCUTOR],
  tasks: [
    {
      name: "2.A"
    }
  ],
  keyOutcomes: "It works",
  nextSteps: "Run some tests",
  reportText:
    "The attendees' positions change based on the engagement date:\n" +
    "- when the engagement is in 2020 the attendees' positions are different from when the engagement is in 2021 or later\n" +
    "- when the engagement is before 2020, none of the attendees have a position\n" +
    "- when saving the report, the advisor organization and interlocutor organization change, based on the primary attendees' primary positions"
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
  await pwExpect((await cols)[3]).toHaveText(
    expectedData.positions[attendeeType],
    {
      useInnerText: true
    }
  )
  await pwExpect((await cols)[4]).toHaveText(
    expectedData.locations[attendeeType],
    {
      useInnerText: true
    }
  )
  await pwExpect((await cols)[5]).toHaveText(
    expectedData.organizations[attendeeType],
    {
      useInnerText: true
    }
  )
}
test.describe("When creating a report", () => {
  let reportUuid
  test("Should show attendee positions at engagement date = now", async () => {
    await CreateReport.open()
    // wait for the page transition and rendering of custom fields
    await CreateReport.fillForm(REPORT_FIELDS)
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.now, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.now, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.now, "interlocutor")
  })
  test("Should switch an attendee between an advisor and interlocutor", async () => {
    const person1 = await CreateReport.getPersonByName(ADVISOR)
    // change attendee to interlocutor
    await pwExpect(person1.advisorCheckbox).not.toHaveCount(0)
    await pwExpect(person1.advisorCheckbox).not.toBeChecked()
    await person1.advisorCheckbox.click()
    // wait for the attendee to be moved to the other section

    const person2 = await CreateReport.getPersonByName(ADVISOR)
    // change attendee to advisor
    await pwExpect(person2.advisorCheckbox).toHaveCount(0)
    await pwExpect(person2.interlocutorCheckbox).not.toHaveCount(0)
    await pwExpect(person2.interlocutorCheckbox).toBeChecked()
    await person2.interlocutorCheckbox.click()
    // wait for the attendee to be moved to the other section

    const person3 = await CreateReport.getPersonByName(ADVISOR)
    await pwExpect(person3.interlocutorCheckbox).toHaveCount(0)
    await pwExpect(person3.advisorCheckbox).not.toHaveCount(0)
    await pwExpect(person3.advisorCheckbox).not.toBeChecked()
  })
  test("Should show report with advisor and interlocutor organizations at engagement date = now", async () => {
    await CreateReport.submitForm()
    reportUuid = await ShowReport.getUuid()
    expect(reportUuid.length).to.equal(36)
    // Validate the reportCommunities
    await pwExpect(
      currentPage().locator("div[name='reportCommunities']")
    ).toHaveText(
      "Name Description\nEF 1.1\nThe complete EF 1.1 organisation\nEF 5\nThe complete EF 5 organization",
      { useInnerText: true }
    )
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.now, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.now, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.now, "interlocutor")
    // Validate the organizations
    await pwExpect
      .poll(async () => await ShowReport.getAdvisorOrg())
      .toEqual(EXPECTED_DATA.now.organizations.author)
    await pwExpect
      .poll(async () => await ShowReport.getInterlocutorOrg())
      .toEqual(EXPECTED_DATA.now.organizations.interlocutor)
  })
  test("Should show attendee positions at engagement date in 2020", async () => {
    // Edit the report
    await (await ShowReport.getEditReportButton()).click()
    // Change the engagement date
    await CreateReport.setEngagementDate(moment("2020-07-01"))
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2020, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2020, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2020, "interlocutor")
  })
  test("Should show report with advisor and interlocutor organizations at engagement date in 2020", async () => {
    await CreateReport.submitForm()
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2020, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2020, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2020, "interlocutor")
    // Validate the organizations
    await pwExpect
      .poll(async () => await ShowReport.getAdvisorOrg())
      .toEqual(EXPECTED_DATA.in_2020.organizations.author)
    await pwExpect
      .poll(async () => await ShowReport.getInterlocutorOrg())
      .toEqual(EXPECTED_DATA.in_2020.organizations.interlocutor)
  })
  test("Should show attendee positions at engagement date in 2019", async () => {
    // Edit the report
    await (await ShowReport.getEditReportButton()).click()
    // Change the engagement date
    await CreateReport.setEngagementDate(moment("2019-07-01"))
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2019, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2019, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2019, "interlocutor")
  })
  test("Should show report with advisor and interlocutor organizations at engagement date in 2019", async () => {
    await CreateReport.submitForm()
    // Validate the attendees
    await validateAttendee(AUTHOR, EXPECTED_DATA.in_2019, "author")
    await validateAttendee(ADVISOR, EXPECTED_DATA.in_2019, "advisor")
    await validateAttendee(INTERLOCUTOR, EXPECTED_DATA.in_2019, "interlocutor")
    // Validate the organizations
    await pwExpect
      .poll(async () => await ShowReport.getAdvisorOrg())
      .toEqual("Unspecified")
    await pwExpect
      .poll(async () => await ShowReport.getInterlocutorOrg())
      .toEqual("Unspecified")
  })
})
