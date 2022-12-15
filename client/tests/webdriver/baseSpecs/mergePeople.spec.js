import { expect } from "chai"
import moment from "moment"
import MergePeople from "../pages/mergePeople.page"

const EXAMPLE_PEOPLE = {
  validLeft: {
    search: "winner",
    fullName: "CIV MERGED, Duplicate Winner",
    name: "MERGED, Duplicate Winner",
    role: "PRINCIPAL",
    position: "Chief of Merge People Test 1",
    status: "ACTIVE",
    email: "merged+winner@example.com",
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
    role: "PRINCIPAL",
    position: "Chief of Merge People Test 2",
    status: "ACTIVE",
    email: "merged+loser@example.com",
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
  advisorRight: {
    search: "andrew",
    fullName: "CIV ANDERSON, Andrew",
    name: "ANDERSON, Andrew",
    role: "ADVISOR",
    position: "EF 1 Manager",
    status: "ACTIVE",
    email: "hunter+andrew@example.com",
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

describe("Merge people of the same role", () => {
  it("Should display fields values of the left person", () => {
    // Open merge people page.
    MergePeople.open()
    MergePeople.title.waitForExist()
    MergePeople.title.waitForDisplayed()

    // Search and select a person from left person field.
    MergePeople.leftPersonField.setValue(EXAMPLE_PEOPLE.validLeft.search)
    MergePeople.waitForAdvancedSelectLoading(EXAMPLE_PEOPLE.validLeft.fullName)
    MergePeople.firstItemFromAdvancedSelect.click()
    browser.pause(500) // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a person from left side.
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "left",
      "Name"
    )

    expect(MergePeople.getColumnContent("left", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.name
    )
    expect(MergePeople.getColumnContent("left", "Role").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.role
    )
    expect(MergePeople.getColumnContent("left", "Position").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.position
    )
    expect(MergePeople.getPreviousPositions("left")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
    expect(MergePeople.getColumnContent("left", "Status").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.status
    )
    expect(MergePeople.getColumnContent("left", "Email").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.email
    )
    expect(MergePeople.getColumnContent("left", "Phone").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.phone
    )
    expect(MergePeople.getColumnContent("left", "Rank").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.rank
    )
    expect(MergePeople.getColumnContent("left", "Gender").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.gender
    )
    expect(MergePeople.getColumnContent("left", "Nationality").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.nationality
    )
    expect(MergePeople.getColumnContent("left", "Biography").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.biography
    )
  })
  it("Should not allow to select the same people", () => {
    MergePeople.rightPersonField.setValue(EXAMPLE_PEOPLE.validLeft.search)
    MergePeople.waitForAdvancedSelectLoading(EXAMPLE_PEOPLE.validLeft.fullName)
    MergePeople.firstItemFromAdvancedSelect.click()

    MergePeople.samePositionsToast.waitForDisplayed()
  })
  it("Should display fields values of the right person", () => {
    // Search and select a person from right person field.
    MergePeople.rightPersonField.setValue(EXAMPLE_PEOPLE.validRight.search)
    MergePeople.waitForAdvancedSelectLoading(EXAMPLE_PEOPLE.validRight.fullName)
    MergePeople.firstItemFromAdvancedSelect.click()
    browser.pause(500) // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a person from left side.
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.name,
      "right",
      "Name"
    )

    expect(MergePeople.getColumnContent("right", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.name
    )
    expect(MergePeople.getColumnContent("right", "Role").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.role
    )
    expect(MergePeople.getColumnContent("right", "Position").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.position
    )
    expect(MergePeople.getPreviousPositions("right")).to.eql(
      EXAMPLE_PEOPLE.validRight.previousPositions
    )
    expect(MergePeople.getColumnContent("right", "Status").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.status
    )
    expect(MergePeople.getColumnContent("right", "Email").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.email
    )
    expect(MergePeople.getColumnContent("right", "Phone").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.phone
    )
    expect(MergePeople.getColumnContent("right", "Rank").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.rank
    )
    expect(MergePeople.getColumnContent("right", "Gender").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.gender
    )
    expect(
      MergePeople.getColumnContent("right", "Nationality").getText()
    ).to.eq(EXAMPLE_PEOPLE.validRight.nationality)
    expect(MergePeople.getColumnContent("left", "Biography").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.biography
    )
  })
  it("Should be able to select all fields from left person", () => {
    MergePeople.getUseAllButton("left").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "mid",
      "Name"
    )

    expect(MergePeople.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.name
    )
    expect(MergePeople.getColumnContent("mid", "Role").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.role
    )
    expect(MergePeople.getColumnContent("mid", "Position").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.position
    )
    expect(MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
    expect(MergePeople.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.status
    )
    expect(MergePeople.getColumnContent("mid", "Email").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.email
    )
    expect(MergePeople.getColumnContent("mid", "Phone").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.phone
    )
    expect(MergePeople.getColumnContent("mid", "Rank").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.rank
    )
    expect(MergePeople.getColumnContent("mid", "Gender").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.gender
    )
    expect(MergePeople.getColumnContent("mid", "Nationality").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.nationality
    )
    expect(MergePeople.getColumnContent("mid", "Biography").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.biography
    )
  })
  it("Should be able to select all fields from right person", () => {
    MergePeople.getUseAllButton("right").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validRight.name,
      "mid",
      "Name"
    )

    expect(MergePeople.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.name
    )
    expect(MergePeople.getColumnContent("mid", "Role").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.role
    )
    expect(MergePeople.getColumnContent("mid", "Position").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.position
    )
    expect(MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validRight.previousPositions
    )
    expect(MergePeople.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.status
    )
    expect(MergePeople.getColumnContent("mid", "Email").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.email
    )
    expect(MergePeople.getColumnContent("mid", "Phone").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.phone
    )
    expect(MergePeople.getColumnContent("mid", "Rank").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.rank
    )
    expect(MergePeople.getColumnContent("mid", "Gender").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.gender
    )
    expect(MergePeople.getColumnContent("mid", "Nationality").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.nationality
    )
    expect(MergePeople.getColumnContent("mid", "Biography").getText()).to.eq(
      EXAMPLE_PEOPLE.validRight.biography
    )
  })
  it("Should be able to select from both left and right side.", () => {
    MergePeople.getSelectButton("left", "Name").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "mid",
      "Name"
    )
    expect(MergePeople.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.name
    )

    MergePeople.getSelectButton("left", "Role").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.role,
      "mid",
      "Role"
    )
    expect(MergePeople.getColumnContent("mid", "Role").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.role
    )

    MergePeople.getSelectButton("left", "Position").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.position,
      "mid",
      "Position"
    )
    expect(MergePeople.getColumnContent("mid", "Position").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.position
    )

    MergePeople.getSelectButton("left", "Status").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.status,
      "mid",
      "Status"
    )
    expect(MergePeople.getColumnContent("mid", "Status").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.status
    )

    MergePeople.getSelectButton("left", "Email").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.email,
      "mid",
      "Email"
    )
    expect(MergePeople.getColumnContent("mid", "Email").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.email
    )

    MergePeople.getSelectButton("left", "Phone").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.phone,
      "mid",
      "Phone"
    )
    expect(MergePeople.getColumnContent("mid", "Phone").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.phone
    )

    MergePeople.getSelectButton("left", "Email").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.email,
      "mid",
      "Email"
    )
    expect(MergePeople.getColumnContent("mid", "Email").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.email
    )

    MergePeople.getSelectButton("left", "Rank").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.rank,
      "mid",
      "Rank"
    )
    expect(MergePeople.getColumnContent("mid", "Rank").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.rank
    )

    MergePeople.getSelectButton("left", "Gender").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.gender,
      "mid",
      "Gender"
    )
    expect(MergePeople.getColumnContent("mid", "Gender").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.gender
    )

    MergePeople.getSelectButton("left", "Nationality").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.nationality,
      "mid",
      "Nationality"
    )
    expect(
      MergePeople.getColumnContent("mid", "Nationality").getText()
    ).to.equal(EXAMPLE_PEOPLE.validLeft.nationality)

    MergePeople.getSelectButton("left", "Biography").click()
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.biography,
      "mid",
      "Biography"
    )
    expect(MergePeople.getColumnContent("mid", "Biography").getText()).to.equal(
      EXAMPLE_PEOPLE.validLeft.biography
    )

    MergePeople.getSelectButton("left", "Previous Positions").click()
    expect(MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
  })
  it("Should be able to merge both people when winner is left person", () => {
    MergePeople.mergePeopleButton.click()
    MergePeople.waitForSuccessAlert()
  })
  it("Should merge notes of the both people", () => {
    MergePeople.showNotesButton.click()
    // Wait for offcanvas to open
    browser.pause(100)
    expect(
      MergePeople.areNotesExist([
        ...EXAMPLE_PEOPLE.validLeft.notes,
        ...EXAMPLE_PEOPLE.validRight.notes
      ])
    ).to.eq(true)
  })
  it("Should be able to delete the loser person", () => {
    MergePeople.openPage(`/people/${EXAMPLE_PEOPLE.validRight.perUuid}`)
    MergePeople.errorTitle.waitForExist()
    expect(MergePeople.errorTitle.getText()).to.equal(
      `User #${EXAMPLE_PEOPLE.validRight.perUuid} not found.`
    )
  })
  it("Should remove the loser from its position and position history", () => {
    MergePeople.openPage(`/positions/${EXAMPLE_PEOPLE.validRight.posUuid}`)
    expect(MergePeople.unoccupiedPositionPersonMessage.getText()).to.equal(
      "Chief of Merge People Test 2 is currently empty."
    )
  })
})

describe("Merge people of different roles", () => {
  it("Should select a principal for the left side", () => {
    // Open merge people page.
    MergePeople.open()
    MergePeople.title.waitForExist()
    MergePeople.title.waitForDisplayed()
    // Search and select a person from left person field.
    MergePeople.leftPersonField.setValue(EXAMPLE_PEOPLE.validLeft.search)
    MergePeople.waitForAdvancedSelectLoading(EXAMPLE_PEOPLE.validLeft.fullName)
    MergePeople.firstItemFromAdvancedSelect.click()
    // Check if the fields displayed properly after selecting a person from left side.
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "left",
      "Name"
    )
  })
  it("Sould select an advisor for the right side", () => {
    MergePeople.rightPersonField.setValue(EXAMPLE_PEOPLE.advisorRight.search)
    MergePeople.waitForAdvancedSelectLoading(
      EXAMPLE_PEOPLE.advisorRight.fullName
    )
    MergePeople.firstItemFromAdvancedSelect.click()
    // Check if the fields displayed properly after selecting a person from left side.
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.advisorRight.name,
      "right",
      "Name"
    )
  })
  it("Should display the different roles warning", () => {
    MergePeople.waitForDifferentRolesAlert()
  })
  it("Should not display the select buttons on each side", () => {
    MergePeople.getSelectButton("left", "Name").waitForDisplayed({
      reverse: true
    })
    MergePeople.getSelectButton("right", "Name").waitForDisplayed({
      reverse: true
    })
  })
  it("Should be able to select all fields from left person", () => {
    MergePeople.getUseAllButton("left").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.validLeft.name,
      "mid",
      "Name"
    )
    expect(MergePeople.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.name
    )
    expect(MergePeople.getColumnContent("mid", "Role").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.role
    )
    expect(MergePeople.getColumnContent("mid", "Position").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.position
    )
    expect(MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.validLeft.previousPositions
    )
    expect(MergePeople.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.status
    )
    expect(MergePeople.getColumnContent("mid", "Email").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.email
    )
    expect(MergePeople.getColumnContent("mid", "Phone").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.phone
    )
    expect(MergePeople.getColumnContent("mid", "Rank").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.rank
    )
    expect(MergePeople.getColumnContent("mid", "Gender").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.gender
    )
    expect(MergePeople.getColumnContent("mid", "Nationality").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.nationality
    )
    expect(MergePeople.getColumnContent("mid", "Biography").getText()).to.eq(
      EXAMPLE_PEOPLE.validLeft.biography
    )
  })
  it("Should be able to select all fields from right person", () => {
    MergePeople.getUseAllButton("right").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergePeople.waitForColumnToChange(
      EXAMPLE_PEOPLE.advisorRight.name,
      "mid",
      "Name"
    )
    expect(MergePeople.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.name
    )
    expect(MergePeople.getColumnContent("mid", "Role").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.role
    )
    expect(MergePeople.getColumnContent("mid", "Position").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.position
    )
    expect(MergePeople.getPreviousPositions("mid")).to.eql(
      EXAMPLE_PEOPLE.advisorRight.previousPositions
    )
    expect(MergePeople.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.status
    )
    expect(MergePeople.getColumnContent("mid", "Email").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.email
    )
    expect(MergePeople.getColumnContent("mid", "Phone").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.phone
    )
    expect(MergePeople.getColumnContent("mid", "Rank").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.rank
    )
    expect(MergePeople.getColumnContent("mid", "Gender").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.gender
    )
    expect(MergePeople.getColumnContent("mid", "Nationality").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.nationality
    )
    expect(MergePeople.getColumnContent("mid", "Biography").getText()).to.eq(
      EXAMPLE_PEOPLE.advisorRight.biography
    )
  })
  it("Should not display clear field buttons on the middle column", () => {
    expect(MergePeople.clearValueButtons.length).to.eq(0)
  })
  it("Should not display edit history button on the middle column", () => {
    MergePeople.editHistoryButton.waitForDisplayed({ reverse: true })
  })
  it("Should be able to merge both people when winner is right person", () => {
    MergePeople.mergePeopleButton.click()
    MergePeople.waitForSuccessAlert()
  })
  it("Should merge notes of the both people", () => {
    MergePeople.showNotesButton.click()
    // Wait for offcanvas to open
    browser.pause(100)
    // As validRight and validLeft merged before, notes should include notes from three people
    expect(
      MergePeople.areNotesExist([
        ...EXAMPLE_PEOPLE.validLeft.notes,
        ...EXAMPLE_PEOPLE.validRight.notes,
        ...EXAMPLE_PEOPLE.advisorRight.notes
      ])
    ).to.eq(true)
  })
  it("Should be able to delete the loser person", () => {
    MergePeople.openPage(`/people/${EXAMPLE_PEOPLE.validLeft.perUuid}`)
    MergePeople.errorTitle.waitForExist()
    expect(MergePeople.errorTitle.getText()).to.equal(
      `User #${EXAMPLE_PEOPLE.validLeft.perUuid} not found.`
    )
  })
})
