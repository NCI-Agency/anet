import { expect } from "chai"
import moment from "moment"
import MergePeople from "../pages/mergePeople.page"

const EXAMPLE_PEOPLE = {
  validLeft: {
    search: "winner",
    fullName: "CIV MERGED, Duplicate Winner",
    name: "MERGED, Duplicate Winner",
    user: "No",
    position: "Chief of Merge People Test 1",
    status: "ACTIVE",
    email: "Network Address\nInternet merged.winner@example.com",
    phone: "+1-234-5678",
    rank: "CIV",
    gender: "MALE",
    nationality: "Afghanistan",
    previousPositions: [
      {
        name: "Chief of Merge People Test 1",
        date: `${moment().format("D MMMM YYYY")} -  `
      }
    ],
    biography: "Winner is a test person who will be merged",
    notes: ["Merge one person note", "A really nice person to work with"],
    perUuid: "3cb2076c-5317-47fe-86ad-76f298993917",
    posUuid: "885dd6bf-4647-4ef7-9bc4-4dd2826064bb"
  },
  validRight: {
    search: "loser",
    fullName: "CTR MERGED, Duplicate Loser",
    name: "MERGED, Duplicate Loser",
    user: "No",
    position: "Chief of Merge People Test 2",
    status: "ACTIVE",
    email: "Network Address\nInternet merged.loser@example.com",
    phone: "+1-876-5432",
    rank: "CTR",
    gender: "FEMALE",
    nationality: "Afghanistan",
    previousPositions: [
      {
        name: "Chief of Merge People Test 2",
        date: `${moment().format("D MMMM YYYY")} -  `
      }
    ],
    biography: "Loser is a test person who will be merged",
    notes: ["Merge two person note"],
    perUuid: "c725aef3-cdd1-4baf-ac72-f28219b234e9",
    posUuid: "4dc40a27-19ae-4e03-a4f3-55b2c768725f"
  },
  userRight: {
    search: "andrew",
    fullName: "CIV ANDERSON, Andrew",
    name: "ANDERSON, Andrew",
    user: "Yes",
    position: "EF 1 Manager",
    status: "ACTIVE",
    email: "Network Address\nInternet andrew@example.com\nNS andrew@example.ns",
    phone: "+1-412-7324",
    rank: "CIV",
    gender: "MALE",
    nationality: "United States of America",
    previousPositions: [
      {
        name: "EF 1 Manager",
        date: `${moment().format("D MMMM YYYY")} -  `
      }
    ],
    biography: "Andrew is the EF 1 Manager",
    notes: ["A really nice person to work with"]
  }
}

describe("Merge people who are both non-users", () => {
  it("Should display fields values of the left person", async() => {
    // Open merge people page.
    await MergePeople.open()
    await (await MergePeople.getTitle()).waitForExist()
    await (await MergePeople.getTitle()).waitForDisplayed()

    // Search and select a person from left person field.
    await (
      await MergePeople.getLeftPersonField()
    ).setValue(EXAMPLE_PEOPLE.validLeft.search)
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a person from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "left",
      "Name"
    )

    expect(
      await (await MergePeople.getColumnContent("left", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.name)
    expect(
      await (await MergePeople.getColumnContent("left", "ANET user")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.user)
    expect(
      await (
        await MergePeople.getColumnContent("left", "Current Position")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.position)
    expect(await MergePeople.getPreviousPositions("left")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
    expect(
      await (await MergePeople.getColumnContent("left", "Status")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.status)
    expect(
      await (
        await MergePeople.getColumnContent("left", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.email)
    expect(
      await (await MergePeople.getColumnContent("left", "Phone")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.phone)
    expect(
      await (await MergePeople.getColumnContent("left", "Rank")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.rank)
    expect(
      await (await MergePeople.getColumnContent("left", "Gender")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.gender)
    expect(
      await (
        await MergePeople.getColumnContent("left", "Nationality")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.nationality)
    expect(
      await (await MergePeople.getColumnContent("left", "Biography")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.biography)
  })
  it("Should not allow to select the same people", async() => {
    await (
      await MergePeople.getRightPersonField()
    ).setValue(EXAMPLE_PEOPLE.validLeft.search)
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()

    await (await MergePeople.getSamePositionsToast()).waitForDisplayed()
  })
  it("Should display fields values of the right person", async() => {
    // Search and select a person from right person field.
    await (
      await MergePeople.getRightPersonField()
    ).setValue(EXAMPLE_PEOPLE.validRight.search)
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validRight.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a person from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.name,
      "right",
      "Name"
    )

    expect(
      await (await MergePeople.getColumnContent("right", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.name)
    expect(
      await (await MergePeople.getColumnContent("right", "ANET user")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.user)
    expect(
      await (
        await MergePeople.getColumnContent("right", "Current Position")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.position)
    expect(await MergePeople.getPreviousPositions("right")).to.eql(
      EXAMPLE_PEOPLE.validRight.previousPositions
    )
    expect(
      await (await MergePeople.getColumnContent("right", "Status")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.status)
    expect(
      await (
        await MergePeople.getColumnContent("right", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.email)
    expect(
      await (await MergePeople.getColumnContent("right", "Phone")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.phone)
    expect(
      await (await MergePeople.getColumnContent("right", "Rank")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.rank)
    expect(
      await (await MergePeople.getColumnContent("right", "Gender")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.gender)
    expect(
      await (
        await MergePeople.getColumnContent("right", "Nationality")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.nationality)
    expect(
      await (await MergePeople.getColumnContent("left", "Biography")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.biography)
  })
  it("Should be able to select all fields from left person", async() => {
    await (await MergePeople.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "mid",
      "Name"
    )

    expect(
      await (await MergePeople.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.name)
    expect(
      await (await MergePeople.getColumnContent("mid", "ANET user")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.user)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Current Position")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.position)
    expect(await MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.status)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.email)
    expect(
      await (await MergePeople.getColumnContent("mid", "Phone")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.phone)
    expect(
      await (await MergePeople.getColumnContent("mid", "Rank")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.rank)
    expect(
      await (await MergePeople.getColumnContent("mid", "Gender")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.gender)
    expect(
      await (await MergePeople.getColumnContent("mid", "Nationality")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.nationality)
    expect(
      await (await MergePeople.getColumnContent("mid", "Biography")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.biography)
  })
  it("Should be able to select all fields from right person", async() => {
    await (await MergePeople.getUseAllButton("right")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.name,
      "mid",
      "Name"
    )

    expect(
      await (await MergePeople.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.name)
    expect(
      await (await MergePeople.getColumnContent("mid", "ANET user")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.user)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Current Position")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.position)
    expect(await MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validRight.previousPositions
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.status)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.email)
    expect(
      await (await MergePeople.getColumnContent("mid", "Phone")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.phone)
    expect(
      await (await MergePeople.getColumnContent("mid", "Rank")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.rank)
    expect(
      await (await MergePeople.getColumnContent("mid", "Gender")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.gender)
    expect(
      await (await MergePeople.getColumnContent("mid", "Nationality")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.nationality)
    expect(
      await (await MergePeople.getColumnContent("mid", "Biography")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.biography)
  })
  it("Should be able to select from both left and right side.", async() => {
    await (await MergePeople.getSelectButton("left", "Name")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.name)

    await (await MergePeople.getSelectButton("left", "ANET user")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.user,
      "mid",
      "ANET user"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "ANET user")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.user)

    await (
      await MergePeople.getSelectButton("left", "Current Position")
    ).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.position,
      "mid",
      "Current Position"
    )
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Current Position")
      ).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.position)

    await (await MergePeople.getSelectButton("left", "Status")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.status,
      "mid",
      "Status"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Status")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.status)

    await (await MergePeople.getSelectButton("left", "Email addresses")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.email,
      "mid",
      "Email addresses"
    )
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.email)

    await (await MergePeople.getSelectButton("left", "Phone")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.phone,
      "mid",
      "Phone"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Phone")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.phone)

    await (await MergePeople.getSelectButton("left", "Email addresses")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.email,
      "mid",
      "Email addresses"
    )
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.email)

    await (await MergePeople.getSelectButton("left", "Rank")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.rank,
      "mid",
      "Rank"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Rank")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.rank)

    await (await MergePeople.getSelectButton("left", "Gender")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.gender,
      "mid",
      "Gender"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Gender")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.gender)

    await (await MergePeople.getSelectButton("left", "Nationality")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.nationality,
      "mid",
      "Nationality"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Nationality")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.nationality)

    await (await MergePeople.getSelectButton("left", "Biography")).click()
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.biography,
      "mid",
      "Biography"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Biography")).getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.biography)

    await (
      await MergePeople.getSelectButton("left", "Previous Positions")
    ).click()
    expect(await MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
  })
  it("Should be able to merge both people when winner is left person", async() => {
    await (await MergePeople.getMergePeopleButton()).click()
    await MergePeople.waitForSuccessAlert()
  })
  it("Should merge notes of the both people", async() => {
    await (await MergePeople.getShowNotesButton()).click()
    // Wait for offcanvas to open
    await browser.pause(100)
    expect(
      await MergePeople.areNotesExist([
        ...EXAMPLE_PEOPLE.validLeft.notes,
        ...EXAMPLE_PEOPLE.validRight.notes
      ])
    ).to.eq(true)
  })
  it("Should be able to delete the loser person", async() => {
    await MergePeople.openPage(`/people/${EXAMPLE_PEOPLE.validRight.perUuid}`)
    await (await MergePeople.getErrorTitle()).waitForExist()
    expect(await (await MergePeople.getErrorTitle()).getText()).to.equal(
      `User #${EXAMPLE_PEOPLE.validRight.perUuid} not found.`
    )
  })
  it("Should remove the loser from its position and position history", async() => {
    await MergePeople.openPage(
      `/positions/${EXAMPLE_PEOPLE.validRight.posUuid}`
    )
    expect(
      await (await MergePeople.getUnoccupiedPositionPersonMessage()).getText()
    ).to.equal("Chief of Merge People Test 2 is currently empty.")
  })
})

describe("Merge user with non-user", () => {
  it("Should select a non-user for the left side", async() => {
    // Open merge people page.
    await MergePeople.open()
    await (await MergePeople.getTitle()).waitForExist()
    await (await MergePeople.getTitle()).waitForDisplayed()
    // Search and select a person from left person field.
    await (
      await MergePeople.getLeftPersonField()
    ).setValue(EXAMPLE_PEOPLE.validLeft.search)
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.validLeft.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // Check if the fields displayed properly after selecting a person from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "left",
      "Name"
    )
  })
  it("Should select a user for the right side", async() => {
    await (
      await MergePeople.getRightPersonField()
    ).setValue(EXAMPLE_PEOPLE.userRight.search)
    await MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.userRight.fullName
    )
    await (await MergePeople.getFirstItemFromAdvancedSelect()).click()
    // Check if the fields displayed properly after selecting a person from left side.
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.userRight.name,
      "right",
      "Name"
    )
  })
  it("Should be able to select all fields from left person", async() => {
    await (await MergePeople.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.name)
    expect(
      await (await MergePeople.getColumnContent("mid", "ANET user")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.user)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Current Position")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.position)
    expect(await MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.status)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.email)
    expect(
      await (await MergePeople.getColumnContent("mid", "Phone")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.phone)
    expect(
      await (await MergePeople.getColumnContent("mid", "Rank")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.rank)
    expect(
      await (await MergePeople.getColumnContent("mid", "Gender")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.gender)
    expect(
      await (await MergePeople.getColumnContent("mid", "Nationality")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.nationality)
    expect(
      await (await MergePeople.getColumnContent("mid", "Biography")).getText()
    ).to.eq(EXAMPLE_PEOPLE.validLeft.biography)
  })
  it("Should be able to select all fields from right person", async() => {
    await (await MergePeople.getUseAllButton("right")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.userRight.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.name)
    expect(
      await (await MergePeople.getColumnContent("mid", "ANET user")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.user)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Current Position")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.position)
    expect(await MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.userRight.previousPositions
    )
    expect(
      await (await MergePeople.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.status)
    expect(
      await (
        await MergePeople.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.email)
    expect(
      await (await MergePeople.getColumnContent("mid", "Phone")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.phone)
    expect(
      await (await MergePeople.getColumnContent("mid", "Rank")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.rank)
    expect(
      await (await MergePeople.getColumnContent("mid", "Gender")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.gender)
    expect(
      await (await MergePeople.getColumnContent("mid", "Nationality")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.nationality)
    expect(
      await (await MergePeople.getColumnContent("mid", "Biography")).getText()
    ).to.eq(EXAMPLE_PEOPLE.userRight.biography)
  })
  it("Should still display clear field buttons on the middle column", async() => {
    const allSelectButtons = await MergePeople.getAllSelectButtons("right")
    const clearValueButtons = await MergePeople.getClearValueButtons()
    const activateFieldButtons = await MergePeople.getActivateFieldButtons()
    const infoButtons = await MergePeople.getInfoButtons()
    expect(
      clearValueButtons.length +
        activateFieldButtons.length +
        infoButtons.length
    ).to.eq(allSelectButtons.length)
  })
  it("Should still display edit history button on the middle column", async() => {
    await (await MergePeople.getEditHistoryButton()).waitForDisplayed()
  })
  it("Should be able to merge both people when winner is right person", async() => {
    await (await MergePeople.getMergePeopleButton()).click()
    await MergePeople.waitForSuccessAlert()
  })
  it("Should merge notes of the both people", async() => {
    await (await MergePeople.getShowNotesButton()).click()
    // Wait for offcanvas to open
    await browser.pause(100)
    // As validRight and validLeft merged before, notes should include notes from three people
    expect(
      await MergePeople.areNotesExist([
        ...EXAMPLE_PEOPLE.validLeft.notes,
        ...EXAMPLE_PEOPLE.validRight.notes,
        ...EXAMPLE_PEOPLE.userRight.notes
      ])
    ).to.eq(true)
  })
  it("Should be able to delete the loser person", async() => {
    await MergePeople.openPage(`/people/${EXAMPLE_PEOPLE.validLeft.perUuid}`)
    await (await MergePeople.getErrorTitle()).waitForExist()
    expect(await (await MergePeople.getErrorTitle()).getText()).to.equal(
      `User #${EXAMPLE_PEOPLE.validLeft.perUuid} not found.`
    )
  })
})
