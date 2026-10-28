import { expect } from "@playwright/test"
import moment from "moment"
import Settings from "../../../platform/node/settings.js"
import MergePeople from "../pages/mergePeople.page.js"
import { currentPage, test, waitFor } from "../support.js"

const hasCustomFields = !!Settings?.fields?.person?.customFields
const EXAMPLE_PEOPLE = {
  validLeft: {
    search: "winner",
    uuid: "3cb2076c-5317-47fe-86ad-76f298993917",
    fullName: "CIV Duplicate Winner Merged",
    familyName: "Merged",
    givenName: "Duplicate Winner",
    user: "No",
    perUuid: "3cb2076c-5317-47fe-86ad-76f298993917",
    position: "Chief of Merge People Test 1",
    posUuid: "885dd6bf-4647-4ef7-9bc4-4dd2826064bb",
    additionalPositions: ["Chief of Staff - MoD"],
    addPosUuids: ["1a45ccd6-40e3-4c51-baf5-15e7e9b8f03d"],
    status: "ACTIVE",
    email: "Network Address\nInternet merged.winner@example.com",
    phone: "+1-234-5678",
    rank: "CIV",
    gender: "MALE",
    nationality: "Afghanistan",
    previousPositions: [
      {
        name: "Primary\nChief of Merge People Test 1",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      },
      {
        name: "Chief of Staff - MoD",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    previousPrimaryPositions: [
      {
        name: "Chief of Merge People Test 1",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    previousAdditionalPositions: [
      {
        name: "Chief of Staff - MoD",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    biography: "Winner is a test person who will be merged",
    notes: ["Merge one person note", "A really nice person to work with"],
    colourOptions: "Red",
    numberField: "5",
    birthday: `${moment("2003-01-31T23:00:00.000Z").format("D MMMM YYYY")}`,
    politicalPosition: "Middle"
  },
  validRight: {
    search: "loser",
    uuid: "c725aef3-cdd1-4baf-ac72-f28219b234e9",
    fullName: "CTR Duplicate Loser Merged",
    familyName: "Merged",
    givenName: "Duplicate Loser",
    user: "No",
    perUuid: "c725aef3-cdd1-4baf-ac72-f28219b234e9",
    position: "Chief of Merge People Test 2",
    posUuid: "4dc40a27-19ae-4e03-a4f3-55b2c768725f",
    additionalPositions: ["Director of Budgeting - MoD"],
    addPosUuids: ["61371573-eefc-4b85-81a0-27d6c0b78c58"],
    status: "ACTIVE",
    email: "No email addresses available",
    phone: "",
    rank: "CTR",
    gender: "FEMALE",
    nationality: "Afghanistan",
    previousPositions: [
      {
        name: "Primary\nChief of Merge People Test 2",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      },
      {
        name: "Director of Budgeting - MoD",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    previousPrimaryPositions: [
      {
        name: "Chief of Merge People Test 2",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    previousAdditionalPositions: [
      {
        name: "Director of Budgeting - MoD",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    biography: "Loser is a test person who will be merged",
    notes: ["Merge two person note"],
    colourOptions: "Red",
    numberField: "6",
    birthday: `${moment("2010-11-11T23:00:00.000Z").format("D MMMM YYYY")}`,
    politicalPosition: "Middle"
  },
  userRight: {
    search: "andrew",
    uuid: "1a557db0-5af5-4ea3-b926-28b5f2e88bf7",
    fullName: "CIV Andrew Anderson",
    familyName: "Anderson",
    givenName: "Andrew",
    user: "Yes",
    perUuid: "1a557db0-5af5-4ea3-b926-28b5f2e88bf7",
    position: "EF 1 Manager",
    posUuid: "38274eea-3438-40f7-8f1e-6529fd4f6191",
    additionalPositions: [],
    addPosUuids: [],
    status: "ACTIVE",
    email: "Network Address\nInternet andrew@example.com\nNS andrew@example.ns",
    phone: "+1-412-7324",
    rank: "CIV",
    gender: "MALE",
    nationality: "United States",
    previousPositions: [
      {
        name: "Primary\nEF 1 Manager",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    previousPrimaryPositions: [
      {
        name: "EF 1 Manager",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    previousAdditionalPositions: [],
    biography: "Andrew is the EF 1 Manager",
    notes: ["A really nice person to work with"],
    colourOptions: "",
    numberField: "",
    birthday: "",
    politicalPosition: ""
  }
}
test.describe("Merge people who are both non-users", () => {
  test("Should display a warning when leaving the page with unsaved changes", async () => {
    await MergePeople.openPage()
    await waitFor(await MergePeople.getTitle(), "visible")
    await (
      await MergePeople.getLeftPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validLeft.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // attempt to leave when only one person is selected, should allow to leave
    await MergePeople.clickLogo()
    await expect(await MergePeople.getModalDialog()).toHaveCount(0)
    await MergePeople.openPage()
    await waitFor(await MergePeople.getTitle(), "visible")
    await (
      await MergePeople.getLeftPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validLeft.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    await (
      await MergePeople.getRightPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validRight.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validRight.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // attempt to leave when both people are selected, should show warning
    await MergePeople.clickLogo()
    await expect(await MergePeople.getModalDialog()).not.toHaveCount(0)
    await (await currentPage().locator(".btn-danger").first()).click()
    await MergePeople.logout()
  })
  test("Should display fields values of the left person", async () => {
    // Open merge people page.
    await MergePeople.openPage()
    await waitFor(await MergePeople.getTitle(), "visible")

    // Search and select a person from left person field.
    await (
      await MergePeople.getLeftPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validLeft.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.uuid,
      "left",
      "UUID"
    )
    await expect(await MergePeople.getColumnContent("left", "UUID")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.uuid,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("left", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.familyName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.givenName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("left"))
      .toEqual(EXAMPLE_PEOPLE.validLeft.previousPositions)
    await expect(
      await MergePeople.getColumnContent("left", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.email, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Phone")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.phone, {
      useInnerText: true
    })
    await expect(await MergePeople.getColumnContent("left", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.rank,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("left", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.biography, {
      useInnerText: true
    })
  })
  test("Should not allow to select the same people", async () => {
    await (
      await MergePeople.getRightPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validLeft.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await expect(
      await MergePeople.getFirstItemRadioButtonFromAdvancedSelect()
    ).toHaveCount(0)
  })
  test("Should display fields values of the right person", async () => {
    // Search and select a person from right person field.
    await (
      await MergePeople.getRightPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validRight.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validRight.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from right side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.uuid,
      "right",
      "UUID"
    )
    await expect(
      await MergePeople.getColumnContent("right", "UUID")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.uuid, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.familyName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.givenName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("right"))
      .toEqual(EXAMPLE_PEOPLE.validRight.previousPositions)
    await expect(
      await MergePeople.getColumnContent("right", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.email, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Phone")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.phone, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Rank")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.rank, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("right", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("left", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.biography, {
      useInnerText: true
    })
  })
  test("Should autoMerge some identical fields from both persons", async () => {
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.nationality, {
      useInnerText: true
    })
    if (hasCustomFields) {
      await expect(
        await MergePeople.getColumnContent("mid", "Choose one of the colours")
      ).toHaveText(EXAMPLE_PEOPLE.validLeft.colourOptions, {
        useInnerText: true
      })
      await expect(
        await MergePeople.getColumnContent("mid", "Choose one of the colours")
      ).toHaveText(EXAMPLE_PEOPLE.validRight.colourOptions, {
        useInnerText: true
      })
    }
    await expect(
      await MergePeople.getColumnContent(
        "mid",
        "Position on the political spectrum"
      )
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.politicalPosition, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent(
        "mid",
        "Position on the political spectrum"
      )
    ).toHaveText(EXAMPLE_PEOPLE.validRight.politicalPosition, {
      useInnerText: true
    })
  })
  test("Should autoMerge the user accounts field from both persons", async () => {
    await expect(
      await MergePeople.getColumnContent("mid", "User accounts")
    ).toHaveText("No user accounts available", {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from left person", async () => {
    await (await MergePeople.getUseAllButton("left")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.uuid,
      "mid",
      "UUID"
    )
    await expect(await MergePeople.getColumnContent("mid", "UUID")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.uuid,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.familyName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.givenName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("mid"))
      .toEqual(EXAMPLE_PEOPLE.validLeft.previousPositions)
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.email, {
      useInnerText: true
    })
    await expect(await MergePeople.getColumnContent("mid", "Phone")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.phone,
      {
        useInnerText: true
      }
    )
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.rank,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.biography, {
      useInnerText: true
    })
    if (hasCustomFields) {
      await expect(
        await MergePeople.getColumnContent("mid", "Number field")
      ).toHaveText(EXAMPLE_PEOPLE.validLeft.numberField, {
        useInnerText: true
      })
    }
    await expect(
      await MergePeople.getColumnContent("mid", "Date of birth")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.birthday, {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from right person", async () => {
    await (await MergePeople.getUseAllButton("right")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from right side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.uuid,
      "mid",
      "UUID"
    )
    await expect(await MergePeople.getColumnContent("mid", "UUID")).toHaveText(
      EXAMPLE_PEOPLE.validRight.uuid,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.familyName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.givenName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("mid"))
      .toEqual(EXAMPLE_PEOPLE.validRight.previousPositions)
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.email, {
      useInnerText: true
    })
    await expect(await MergePeople.getColumnContent("mid", "Phone")).toHaveText(
      EXAMPLE_PEOPLE.validRight.phone,
      {
        useInnerText: true
      }
    )
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.validRight.rank,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.biography, {
      useInnerText: true
    })
    if (hasCustomFields) {
      await expect(
        await MergePeople.getColumnContent("mid", "Number field")
      ).toHaveText(EXAMPLE_PEOPLE.validRight.numberField, {
        useInnerText: true
      })
    }
    await expect(
      await MergePeople.getColumnContent("mid", "Date of birth")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.birthday, {
      useInnerText: true
    })
  })
  test("Should be able to select from both left and right side", async () => {
    await (await MergePeople.getSelectButton("left", "UUID")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.uuid,
      "mid",
      "UUID"
    )
    await expect(await MergePeople.getColumnContent("mid", "UUID")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.uuid,
      {
        useInnerText: true
      }
    )
    await (await MergePeople.getSelectButton("left", "Family name")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.familyName,
      "mid",
      "Family name"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.familyName, {
      useInnerText: true
    })
    await (await MergePeople.getSelectButton("left", "Given name")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.givenName,
      "mid",
      "Given name"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.givenName, {
      useInnerText: true
    })

    // Pick position data from the right!
    await (
      await MergePeople.getSelectButton("right", "Primary Position")
    ).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.position,
      "mid",
      "Primary Position"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("mid"))
      .toEqual(EXAMPLE_PEOPLE.validRight.previousPositions)
    await (await MergePeople.getSelectButton("left", "Email addresses")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.email,
      "mid",
      "Email addresses"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.email, {
      useInnerText: true
    })
    await (await MergePeople.getSelectButton("left", "Phone")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.phone,
      "mid",
      "Phone"
    )
    await expect(await MergePeople.getColumnContent("mid", "Phone")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.phone,
      {
        useInnerText: true
      }
    )
    await (await MergePeople.getSelectButton("left", "Rank")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.rank,
      "mid",
      "Rank"
    )
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.rank,
      {
        useInnerText: true
      }
    )
    await (await MergePeople.getSelectButton("left", "Gender")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.gender,
      "mid",
      "Gender"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.gender, {
      useInnerText: true
    })
    await (await MergePeople.getSelectButton("left", "Biography")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.biography,
      "mid",
      "Biography"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.biography, {
      useInnerText: true
    })
    if (hasCustomFields) {
      await (await MergePeople.getSelectButton("left", "Number field")).click()
      await MergePeople.waitForColumnToChange(
        EXAMPLE_PEOPLE.validLeft.numberField,
        "mid",
        "Number field"
      )
      await expect(
        await MergePeople.getColumnContent("mid", "Number field")
      ).toHaveText(EXAMPLE_PEOPLE.validLeft.numberField, {
        useInnerText: true
      })
    }
    await (await MergePeople.getSelectButton("left", "Date of birth")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.birthday,
      "mid",
      "Date of birth"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Date of birth")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.birthday, {
      useInnerText: true
    })
  })
  test("Should be able to merge both people when winner is left person", async () => {
    await (await MergePeople.getMergePeopleButton()).click()
    await MergePeople.waitForSuccessAlert()
  })
  test("Should have merged notes of the both people", async () => {
    await (await MergePeople.getShowNotesButton()).click()
    // Wait for offcanvas to open

    await expect
      .poll(
        async () =>
          await MergePeople.areNotesExist([
            ...EXAMPLE_PEOPLE.validLeft.notes,
            ...EXAMPLE_PEOPLE.validRight.notes
          ])
      )
      .toEqual(true)
  })
  test("Should have correctly set the primary position of the merged person from the right", async () => {
    await waitFor(await MergePeople.getPrimaryPosition(), "visible")
    await expect(await MergePeople.getPrimaryPosition()).toHaveText(
      EXAMPLE_PEOPLE.validRight.position,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the additional positions of the merged person from the right", async () => {
    await expect
      .poll(async () => await MergePeople.getAdditionalPositions())
      .toEqual(EXAMPLE_PEOPLE.validRight.additionalPositions)
  })
  test("Should have correctly set the position history of the merged person from the right", async () => {
    await expect
      .poll(async () => await MergePeople.getPreviousPositionsElements(true))
      .toEqual(EXAMPLE_PEOPLE.validRight.previousPrimaryPositions)
    await expect
      .poll(async () => await MergePeople.getPreviousPositionsElements(false))
      .toEqual(EXAMPLE_PEOPLE.validRight.previousAdditionalPositions)
  })
  test("Should have correctly set the current assigned person of the primary position of the merged person from the right", async () => {
    await MergePeople.openPage(
      `/positions/${EXAMPLE_PEOPLE.validRight.posUuid}`
    )
    await expect(
      await MergePeople.getUnoccupiedPositionPersonMessage()
    ).toHaveCount(0)
    await expect(await MergePeople.getPositionCurrentPersonName()).toHaveText(
      EXAMPLE_PEOPLE.validLeft.fullName,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the current assigned person of the additional positions of the merged person from the right", async () => {
    for (const addPosUuid of EXAMPLE_PEOPLE.validRight.addPosUuids) {
      await MergePeople.openPage(`/positions/${addPosUuid}`)
      await expect(
        await MergePeople.getUnoccupiedPositionPersonMessage()
      ).toHaveCount(0)
      await expect(await MergePeople.getPositionCurrentPersonName()).toHaveText(
        EXAMPLE_PEOPLE.validLeft.fullName,
        {
          useInnerText: true
        }
      )
    }
  })
  test("Should have deleted the loser person", async () => {
    await MergePeople.openPage(`/people/${EXAMPLE_PEOPLE.validRight.perUuid}`)
    await expect(await MergePeople.getErrorTitle()).toHaveText(
      `User #${EXAMPLE_PEOPLE.validRight.perUuid} not found.`,
      {
        useInnerText: true
      }
    )
  })
  test("Should have removed the loser from their primary position and history", async () => {
    await MergePeople.openPage(`/positions/${EXAMPLE_PEOPLE.validLeft.posUuid}`)
    await expect(await MergePeople.getPositionCurrentPersonName()).toHaveCount(
      0
    )
    await expect(
      await MergePeople.getUnoccupiedPositionPersonMessage()
    ).toHaveText(`${EXAMPLE_PEOPLE.validLeft.position} is currently empty.`, {
      useInnerText: true
    })
  })
  test("Should have removed the loser from their additional positions and history", async () => {
    for (let i = 0; i < EXAMPLE_PEOPLE.validLeft.addPosUuids.length; i++) {
      await MergePeople.openPage(
        `/positions/${EXAMPLE_PEOPLE.validLeft.addPosUuids[i]}`
      )
      await expect(
        await MergePeople.getPositionCurrentPersonName()
      ).toHaveCount(0)
      await expect(
        await MergePeople.getUnoccupiedPositionPersonMessage()
      ).toHaveText(
        `${EXAMPLE_PEOPLE.validLeft.additionalPositions[i]} is currently empty.`,
        {
          useInnerText: true
        }
      )
    }
  })
})
test.describe("Merge user with non-user", () => {
  test("Should select a non-user for the left side", async () => {
    // Open merge people page.
    await MergePeople.openPage()
    await waitFor(await MergePeople.getTitle(), "visible")
    // Search and select a person from left person field.
    await (
      await MergePeople.getLeftPersonField()
    ).fill(String(EXAMPLE_PEOPLE.validLeft.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // Check if the fields displayed properly after selecting a person from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.familyName,
      "left",
      "Family name"
    )
  })
  test("Should select a user for the right side", async () => {
    await (
      await MergePeople.getRightPersonField()
    ).fill(String(EXAMPLE_PEOPLE.userRight.search))
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.userRight.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // Check if the fields displayed properly after selecting a person from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.userRight.familyName,
      "right",
      "Family name"
    )
  })
  test("Should autoMerge some identical fields from both persons", async () => {
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.status, {
      useInnerText: true
    })
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.rank,
      {
        useInnerText: true
      }
    )
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.userRight.rank,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.gender, {
      useInnerText: true
    })
  })
  test("Should autoMerge the user accounts field from both persons", async () => {
    await expect(
      await MergePeople.getColumnContent("mid", "User accounts")
    ).toHaveText("Domain username\nandrew", {
      useInnerText: true
    })
  })
  test("should be able to individually select email addresses", async () => {
    // select all left
    const selectAllEmailsLeftButton = await MergePeople.getSingleSelectButton(
      "left",
      "Email addresses"
    )
    await selectAllEmailsLeftButton.click()
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.email, {
      useInnerText: true
    })

    // select all right
    const selectAllEmailsRightButton = await MergePeople.getSingleSelectButton(
      "right",
      "Email addresses"
    )
    await selectAllEmailsRightButton.click()
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.email, {
      useInnerText: true
    })

    // select one on the left and keep one on the right
    const selectOneEmailLeftButton = await (
      await MergePeople.getColumnContent("left", "Email addresses")
    )
      .locator("button")
      .first()
    await selectOneEmailLeftButton.click()
    const expectedEmail =
      EXAMPLE_PEOPLE.validLeft.email +
      "\n" +
      EXAMPLE_PEOPLE.userRight.email.split("\n")[2]
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(expectedEmail, {
      useInnerText: true
    })

    // remove the first email from the middle
    const removeFirstEmailButton = await (
      await MergePeople.getColumnContent("mid", "Email addresses")
    )
      .locator("button")
      .first()
    await removeFirstEmailButton.click()
    const emailsRight = EXAMPLE_PEOPLE.userRight.email.split("\n")
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(`${emailsRight[0]}\n${emailsRight[2]}`, {
      useInnerText: true
    })

    // remove the second email from the middle
    const removeSecondEmailButton = await (
      await MergePeople.getColumnContent("mid", "Email addresses")
    )
      .locator("button")
      .first()
    await removeSecondEmailButton.click()
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText("No email addresses available", {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from left person", async () => {
    await (await MergePeople.getUseAllButton("left")).click()
    // wait for the rendering of custom fields
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.familyName,
      "mid",
      "Family name"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.familyName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.givenName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.validRight.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("mid"))
      .toEqual(EXAMPLE_PEOPLE.validRight.previousPositions)
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.email, {
      useInnerText: true
    })
    await expect(await MergePeople.getColumnContent("mid", "Phone")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.phone,
      {
        useInnerText: true
      }
    )
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.validLeft.rank,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.biography, {
      useInnerText: true
    })
    if (hasCustomFields) {
      await expect(
        await MergePeople.getColumnContent("mid", "Choose one of the colours")
      ).toHaveText(EXAMPLE_PEOPLE.validLeft.colourOptions, {
        useInnerText: true
      })
      await expect(
        await MergePeople.getColumnContent("mid", "Number field")
      ).toHaveText(EXAMPLE_PEOPLE.validLeft.numberField, {
        useInnerText: true
      })
    }
    await expect(
      await MergePeople.getColumnContent("mid", "Date of birth")
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.birthday, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent(
        "mid",
        "Position on the political spectrum"
      )
    ).toHaveText(EXAMPLE_PEOPLE.validLeft.politicalPosition, {
      useInnerText: true
    })

    // It should still have the merged user accounts field from both persons!
    await expect(
      await MergePeople.getColumnContent("mid", "User accounts")
    ).toHaveText("Domain username\nandrew", {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from right person", async () => {
    await (await MergePeople.getUseAllButton("right")).click()
    // wait for the rendering of custom fields
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.userRight.familyName,
      "mid",
      "Family name"
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Family name")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.familyName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Given name")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.givenName, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "ANET user")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.user, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Primary Position")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.position, {
      useInnerText: true
    })
    await expect
      .poll(async () => await MergePeople.getPreviousPositions("mid"))
      .toEqual(EXAMPLE_PEOPLE.userRight.previousPositions)
    await expect(
      await MergePeople.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.status, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.email, {
      useInnerText: true
    })
    await expect(await MergePeople.getColumnContent("mid", "Phone")).toHaveText(
      EXAMPLE_PEOPLE.userRight.phone,
      {
        useInnerText: true
      }
    )
    await expect(await MergePeople.getColumnContent("mid", "Rank")).toHaveText(
      EXAMPLE_PEOPLE.userRight.rank,
      {
        useInnerText: true
      }
    )
    await expect(
      await MergePeople.getColumnContent("mid", "Gender")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.gender, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Nationality")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.nationality, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent("mid", "Biography")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.biography, {
      useInnerText: true
    })
    if (hasCustomFields) {
      await expect(
        await MergePeople.getColumnContent("mid", "Choose one of the colours")
      ).toHaveText(EXAMPLE_PEOPLE.userRight.colourOptions, {
        useInnerText: true
      })
      await expect(
        await MergePeople.getColumnContent("mid", "Number field")
      ).toHaveText(EXAMPLE_PEOPLE.userRight.numberField, {
        useInnerText: true
      })
    }
    await expect(
      await MergePeople.getColumnContent("mid", "Date of birth")
    ).toHaveText(EXAMPLE_PEOPLE.userRight.birthday, {
      useInnerText: true
    })
    await expect(
      await MergePeople.getColumnContent(
        "mid",
        "Position on the political spectrum"
      )
    ).toHaveText(EXAMPLE_PEOPLE.userRight.politicalPosition, {
      useInnerText: true
    })

    // It should still have the merged user accounts field from both persons!
    await expect(
      await MergePeople.getColumnContent("mid", "User accounts")
    ).toHaveText("Domain username\nandrew", {
      useInnerText: true
    })
  })
  test("Should be able to merge both people when winner is right person", async () => {
    await (await MergePeople.getMergePeopleButton()).click()
    await MergePeople.waitForSuccessAlert()
  })
  test("Should have merged notes of the both people", async () => {
    await (await MergePeople.getShowNotesButton()).click()
    // Wait for offcanvas to open

    // As validRight and validLeft merged before, notes should include notes from three people
    await expect
      .poll(
        async () =>
          await MergePeople.areNotesExist([
            ...EXAMPLE_PEOPLE.validLeft.notes,
            ...EXAMPLE_PEOPLE.validRight.notes,
            ...EXAMPLE_PEOPLE.userRight.notes
          ])
      )
      .toEqual(true)
  })
  test("Should have the merged user accounts from both persons", async () => {
    await expect(await MergePeople.getUserAccountsField()).toHaveText(
      "User accounts\nDomain username\nandrew",
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the primary position of the merged person from the right", async () => {
    await waitFor(await MergePeople.getPrimaryPosition(), "visible")
    await expect(await MergePeople.getPrimaryPosition()).toHaveText(
      EXAMPLE_PEOPLE.userRight.position,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the additional positions of the merged person from the right", async () => {
    await expect
      .poll(async () => await MergePeople.getAdditionalPositions())
      .toEqual(EXAMPLE_PEOPLE.userRight.additionalPositions)
  })
  test("Should have correctly set the position history of the merged person from the right", async () => {
    await expect
      .poll(async () => await MergePeople.getPreviousPositionsElements(true))
      .toEqual(EXAMPLE_PEOPLE.userRight.previousPrimaryPositions)
    await expect
      .poll(async () => await MergePeople.getPreviousPositionsElements(false))
      .toEqual(EXAMPLE_PEOPLE.userRight.previousAdditionalPositions)
  })
  test("Should have correctly set the current assigned person of the primary position of the merged person from the right", async () => {
    await MergePeople.openPage(`/positions/${EXAMPLE_PEOPLE.userRight.posUuid}`)
    await expect(
      await MergePeople.getUnoccupiedPositionPersonMessage()
    ).toHaveCount(0)
    await expect(await MergePeople.getPositionCurrentPersonName()).toHaveText(
      EXAMPLE_PEOPLE.userRight.fullName,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the current assigned person of the additional positions of the merged person from the right", async () => {
    for (const addPosUuid of EXAMPLE_PEOPLE.userRight.addPosUuids) {
      await MergePeople.openPage(`/positions/${addPosUuid}`)
      await expect(
        await MergePeople.getUnoccupiedPositionPersonMessage()
      ).toHaveCount(0)
      await expect(await MergePeople.getPositionCurrentPersonName()).toHaveText(
        EXAMPLE_PEOPLE.userRight.fullName,
        {
          useInnerText: true
        }
      )
    }
  })
  test("Should have deleted the loser person", async () => {
    await MergePeople.openPage(`/people/${EXAMPLE_PEOPLE.validLeft.perUuid}`)
    await expect(await MergePeople.getErrorTitle()).toHaveText(
      `User #${EXAMPLE_PEOPLE.validLeft.perUuid} not found.`,
      {
        useInnerText: true
      }
    )
  })
  test("Should have removed the loser from their primary position and history", async () => {
    await MergePeople.openPage(
      `/positions/${EXAMPLE_PEOPLE.validRight.posUuid}`
    )
    await expect(await MergePeople.getPositionCurrentPersonName()).toHaveCount(
      0
    )
    await expect(
      await MergePeople.getUnoccupiedPositionPersonMessage()
    ).toHaveText(`${EXAMPLE_PEOPLE.validRight.position} is currently empty.`, {
      useInnerText: true
    })
  })
  test("Should have removed the loser from their additional positions and history", async () => {
    for (let i = 0; i < EXAMPLE_PEOPLE.validRight.addPosUuids.length; i++) {
      await MergePeople.openPage(
        `/positions/${EXAMPLE_PEOPLE.validRight.addPosUuids[i]}`
      )
      await expect(
        await MergePeople.getPositionCurrentPersonName()
      ).toHaveCount(0)
      await expect(
        await MergePeople.getUnoccupiedPositionPersonMessage()
      ).toHaveText(
        `${EXAMPLE_PEOPLE.validRight.additionalPositions[i]} is currently empty.`,
        {
          useInnerText: true
        }
      )
    }
  })
})
