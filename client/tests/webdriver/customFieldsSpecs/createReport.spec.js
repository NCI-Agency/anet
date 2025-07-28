import { expect } from "chai"
import CreateReport from "../pages/createReport.page"

const GRID_LOCATION = {
  lat: "52.1178",
  lng: "4.28",
  displayedCoordinate: "31UET8764074913"
}

const REPORT = "Interior"
const REPORT_VALUE = "Talk to the Interior about things"
const REPORT_COMPLETE = `${REPORT_VALUE}`

const INVALID_ENGAGEMENT_DURATION_1 = "123456"
const INVALID_ENGAGEMENT_DURATION_2 = "-1"
// positive sliced at 4th digit, negative should turn into 0
const VALID_ENGAGEMENT_DURATION_1 = "1234"
const VALID_ENGAGEMENT_DURATION_2 = "0"

const SEARCH_KEY = "LIN"
const SEARCH_PEOPLE_COMPLETE_1 = "CIV GUIST, Lin"
const SEARCH_ORGANIZATION_COMPLETE = "LNG | Linguistic"
const SEARCH_POSITION_COMPLETE_1 = "LNG Advisor A"

const PERSON = "EF 2.1"
const PERSON_VALUE_1 = "HENDERSON, Henry"
const PERSON_VALUE_2 = "JACKSON, Jack"
const PERSON_COMPLETE_1 = `OF-6 ${PERSON_VALUE_1}`
const PERSON_COMPLETE_2 = `OF-9 ${PERSON_VALUE_2}`

const POSITION = "MOD-FO"
const POSITION_VALUE_1 = "Chief of Staff - MoD"
const POSITION_VALUE_2 = "Executive Assistant to the MoD"
const POSITION_VALUE_3 = "Minister of Defense"
const POSITION_COMPLETE_1 = `${POSITION_VALUE_1}`
const POSITION_COMPLETE_2 = `${POSITION_VALUE_2}`
const POSITION_COMPLETE_3 = `${POSITION_VALUE_3}`

const SHORT_WAIT_MS = 1000

describe("Create report form page", () => {
  describe("When creating a report", () => {
    it("Should be able to load the form", async () => {
      await CreateReport.open()
      await browser.pause(500) // wait for the page transition and rendering of custom fields
      await (await CreateReport.getForm()).waitForExist()
      await (await CreateReport.getForm()).waitForDisplayed()
    })

    it("Should be able to set the grid location", async () => {
      await (
        await CreateReport.getGridLocationLatField()
      ).setValue(GRID_LOCATION.lat)
      await (
        await CreateReport.getGridLocationLngField()
      ).setValue(GRID_LOCATION.lng)
      await (await CreateReport.getGridLocationInfoButton()).click()
      await (await CreateReport.getGridLocationMgrsButton()).waitForExist()
      await (await CreateReport.getGridLocationMgrsButton()).waitForDisplayed()
      await (await CreateReport.getGridLocationMgrsButton()).click()
      expect(
        await (
          await CreateReport.getGridLocationDisplayedCoordinateField()
        ).getValue()
      ).to.equal(GRID_LOCATION.displayedCoordinate)
      await (await CreateReport.getGridLocationInfoButton()).click()
      await (await CreateReport.getGridLocationLatLonButton()).waitForExist()
      await (
        await CreateReport.getGridLocationLatLonButton()
      ).waitForDisplayed()
      await (await CreateReport.getGridLocationLatLonButton()).click()
      expect(
        await (await CreateReport.getGridLocationLatField()).getValue()
      ).to.equal(GRID_LOCATION.lat)
      expect(
        await (await CreateReport.getGridLocationLngField()).getValue()
      ).to.equal(GRID_LOCATION.lng)
    })

    it("Should be able to prevent invalid duration values", async () => {
      await (
        await CreateReport.getDuration()
      ).setValue(INVALID_ENGAGEMENT_DURATION_1)
      await browser.waitUntil(
        async () => {
          return (
            (await (await CreateReport.getDuration()).getValue()) ===
            VALID_ENGAGEMENT_DURATION_1
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Large positive duration value was not sliced "
        }
      )
      await (
        await CreateReport.getDuration()
      ).setValue(INVALID_ENGAGEMENT_DURATION_2)
      await browser.waitUntil(
        async () => {
          return (
            (await (await CreateReport.getDuration()).getValue()) ===
            VALID_ENGAGEMENT_DURATION_2
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Negative duration value did not change to zero"
        }
      )
    })

    it("Should be able to select an ANET object reference", async () => {
      await (await CreateReport.getTestReferenceFieldLabel()).waitForExist()
      await (await CreateReport.getTestReferenceFieldLabel()).waitForDisplayed()
      expect(
        await (await CreateReport.getTestReferenceFieldLabel()).getText()
      ).to.equal("Related report")
      await (await CreateReport.getTestReferenceFieldHelpText()).waitForExist()
      await (
        await CreateReport.getTestReferenceFieldHelpText()
      ).waitForDisplayed()
      expect(
        await (await CreateReport.getTestReferenceFieldHelpText()).getText()
      ).to.equal("Here you can link to a related report")

      // Only input type is Reports, so there should be no button to select a type
      expect(
        await (
          await CreateReport.getTestReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find reports")
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateReport.getTestReferenceFieldButton("Reports")
        ).isExisting()
      ).to.be.false
      await (await CreateReport.getTestReferenceFieldLabel()).click()
      await (await CreateReport.getTestReferenceField()).setValue(REPORT)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem(),
        REPORT_COMPLETE
      )
      expect(
        await (
          await CreateReport.getTestReferenceFieldAdvancedSelectFirstItem()
        ).getText()
      ).to.include(REPORT_COMPLETE)
      await (
        await CreateReport.getTestReferenceFieldAdvancedSelectFirstItem()
      ).click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreateReport.getTestReferenceField()).getValue()).to
        .be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await CreateReport.getTestReferenceFieldValue()).isExisting()
      ).to.be.true
      expect(
        await (await CreateReport.getTestReferenceFieldValue()).getText()
      ).to.include(REPORT_VALUE)

      // Delete selected value
      await (
        await (await CreateReport.getTestReferenceFieldValue()).$("button")
      ).click()
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await CreateReport.getTestReferenceFieldValue()).isExisting()
      ).to.be.false

      // Select it again
      await (await CreateReport.getTestReferenceFieldLabel()).click()
      await (await CreateReport.getTestReferenceField()).setValue(REPORT)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem(),
        REPORT_COMPLETE
      )
      await (
        await CreateReport.getTestReferenceFieldAdvancedSelectFirstItem()
      ).click()
    })

    it("Should be able to select multiple ANET object references", async () => {
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForExist()
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForDisplayed()
      expect(
        await (await CreateReport.getTestMultiReferenceFieldLabel()).getText()
      ).to.equal("Additional engagement needed for")
      await (
        await CreateReport.getTestMultiReferenceFieldHelpText()
      ).waitForExist()
      await (
        await CreateReport.getTestMultiReferenceFieldHelpText()
      ).waitForDisplayed()
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldHelpText()
        ).getText()
      ).to.equal(
        "Here you can link to people, positions and organizations that need an additional engagement"
      )

      // Check search query does not reset when changing object type
      // Default input type is People
      await (
        await CreateReport.getTestMultiReferenceFieldButton("People")
      ).scrollIntoView()
      expect(
        await (
          await CreateReport.getTestMultiReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find people")
      await (await CreateReport.getTestMultiReferenceFieldLabel()).click()
      await (
        await CreateReport.getTestMultiReferenceField()
      ).setValue(SEARCH_KEY)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        SEARCH_PEOPLE_COMPLETE_1
      )
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            1
          )
        ).getText()
      ).to.include(SEARCH_PEOPLE_COMPLETE_1)
      // Click outside the overlay
      await (await CreateReport.getTestMultiReferenceFieldIcon()).click()
      // Change input type to Organizations
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Organizations")
      ).scrollIntoView()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Organizations")
      ).click()
      expect(
        await (
          await CreateReport.getTestMultiReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find organizations")
      await (await CreateReport.getTestMultiReferenceField()).click()
      expect(
        await (await CreateReport.getTestMultiReferenceField()).getValue()
      ).to.equal(SEARCH_KEY)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        SEARCH_ORGANIZATION_COMPLETE
      )
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            1
          )
        ).getText()
      ).to.include(SEARCH_ORGANIZATION_COMPLETE)
      // Click outside the overlay
      await (await CreateReport.getTestMultiReferenceFieldIcon()).click()
      // Change input type to Positions
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).scrollIntoView()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).click()
      expect(
        await (
          await CreateReport.getTestMultiReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find positions")
      await (await CreateReport.getTestMultiReferenceField()).click()
      expect(
        await (await CreateReport.getTestMultiReferenceField()).getValue()
      ).to.equal(SEARCH_KEY)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        SEARCH_POSITION_COMPLETE_1
      )
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            1
          )
        ).getText()
      ).to.include(SEARCH_POSITION_COMPLETE_1)
      // Click outside the overlay
      await (await CreateReport.getTestMultiReferenceFieldIcon()).click()
      // Advanced select input does not get empty
      expect(
        await (await CreateReport.getTestMultiReferenceField()).getValue()
      ).to.equal(SEARCH_KEY)
      // Change input type to People
      await (
        await CreateReport.getTestMultiReferenceFieldButton("People")
      ).scrollIntoView()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("People")
      ).click()
      await (await CreateReport.getTestMultiReferenceField()).click()
      // After preserving search query, setValue does not work consistently
      // input field values are sometimes concatenated
      // Therefore, clear input field previous value before setting new value.
      await CreateReport.deleteInput(
        await CreateReport.getTestMultiReferenceField()
      )
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()

      // Default input type is People
      expect(
        await (
          await CreateReport.getTestMultiReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find people")
      await (await CreateReport.getTestMultiReferenceField()).click()
      // After preserving search query, setValue does not work consistently
      // input field values are sometimes concatenated
      // Therefore, clear input field previous value before setting new value.
      await CreateReport.deleteInput(
        await CreateReport.getTestMultiReferenceField()
      )
      await (await CreateReport.getTestMultiReferenceField()).setValue(PERSON)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        PERSON_COMPLETE_1
      )
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            1
          )
        ).getText()
      ).to.include(PERSON_COMPLETE_1)
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(1)
      ).click()
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            2
          )
        ).getText()
      ).to.include(PERSON_COMPLETE_2)
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(2)
      ).click()
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Advanced select input does not get empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await CreateReport.getTestMultiReferenceField()).getValue()
      ).to.equal(PERSON)
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValue()
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(1)
        ).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(2)
        ).getText()
      ).to.include(PERSON_VALUE_2)

      // Click outside the overlay
      await (await CreateReport.getTestMultiReferenceFieldIcon()).click()
      // Change input type to Positions
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).scrollIntoView()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).click()
      expect(
        await (
          await CreateReport.getTestMultiReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find positions")
      await (await CreateReport.getTestMultiReferenceField()).click()
      // After preserving search query, setValue does not work consistently
      // input field values are sometimes concatenated
      // Therefore, clear input field previous value before setting new value.
      await CreateReport.deleteInput(
        await CreateReport.getTestMultiReferenceField()
      )
      await (await CreateReport.getTestMultiReferenceField()).setValue(POSITION)
      await CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        POSITION_COMPLETE_1
      )
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            1
          )
        ).getText()
      ).to.include(POSITION_COMPLETE_1)
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(1)
      ).click()
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            2
          )
        ).getText()
      ).to.include(POSITION_COMPLETE_2)
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(2)
      ).click()
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
            3
          )
        ).getText()
      ).to.include(POSITION_COMPLETE_3)
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(3)
      ).click()
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Advanced select input does not get empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await CreateReport.getTestMultiReferenceField()).getValue()
      ).to.equal(POSITION)
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValue()
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(3)
        ).getText()
      ).to.include(POSITION_VALUE_1)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(4)
        ).getText()
      ).to.include(POSITION_VALUE_2)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(5)
        ).getText()
      ).to.include(POSITION_VALUE_3)

      // Should have 5 values
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(5)
      // Delete one of the selected values
      await (
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(3)
        ).$("button")
      ).click()
      // Should have only 4 values left
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(4)
      // 3rd value should have changed
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(3)
        ).getText()
      ).to.include(POSITION_VALUE_2)
    })

    it("Should be able to save a report with ANET object references", async () => {
      // Submit the report
      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()
      expect(await (await CreateReport.getAlert()).getText()).to.include(
        "The following errors must be fixed"
      )

      // Check ANET object reference
      await (await CreateReport.getTestReferenceFieldLabel()).waitForExist()
      await (await CreateReport.getTestReferenceFieldLabel()).waitForDisplayed()
      expect(
        await (await CreateReport.getTestReferenceFieldValue()).getText()
      ).to.include(REPORT_VALUE)

      // Check ANET object multi-references
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForExist()
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForDisplayed()
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(4)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(1)
        ).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(2)
        ).getText()
      ).to.include(PERSON_VALUE_2)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(3)
        ).getText()
      ).to.include(POSITION_VALUE_2)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(4)
        ).getText()
      ).to.include(POSITION_VALUE_3)
    })

    it("Should be able to edit a report with ANET object references", async () => {
      // Edit the report
      await (await CreateReport.getEditButton()).click()

      await (await CreateReport.getTestReferenceFieldLabel()).waitForExist()
      await (await CreateReport.getTestReferenceFieldLabel()).waitForDisplayed()
      // Default input type is People
      expect(
        await (
          await CreateReport.getTestReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find reports")
      // Check ANET object reference
      expect(
        await (await CreateReport.getTestReferenceFieldValue()).getText()
      ).to.include(REPORT_VALUE)
      // Delete selected value
      await (await CreateReport.getTestReferenceFieldValue()).scrollIntoView()
      await (
        await (await CreateReport.getTestReferenceFieldValue()).$("button")
      ).click()

      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForExist()
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForDisplayed()
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).scrollIntoView()
      // Default input type is People
      expect(
        await (
          await CreateReport.getTestMultiReferenceField()
        ).getAttribute("placeholder")
      ).to.equal("Find people")
      // Check ANET object multi-references
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(4)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(1)
        ).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(2)
        ).getText()
      ).to.include(PERSON_VALUE_2)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(3)
        ).getText()
      ).to.include(POSITION_VALUE_2)
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(4)
        ).getText()
      ).to.include(POSITION_VALUE_3)
      // Delete selected values
      const rows = await CreateReport.getTestMultiReferenceFieldValueRows()
      for (const r of rows) {
        const button = await r.$("button")
        await button.scrollIntoView()
        await button.click()
      }
    })

    it("Should be able to save a report without any ANET object references", async () => {
      // Submit the report
      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()
      const alertMessage = await (await CreateReport.getAlert()).getText()
      expect(alertMessage).to.include("The following errors must be fixed")

      // Check ANET object reference
      await (await CreateReport.getTestReferenceFieldLabel()).waitForExist()
      await (await CreateReport.getTestReferenceFieldLabel()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await CreateReport.getTestReferenceFieldValue()).isExisting()
      ).to.be.false

      // Check ANET object multi-references
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForExist()
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateReport.getTestMultiReferenceFieldValue()
        ).isExisting()
      ).to.be.false
    })

    it("Should be able to delete the report", async () => {
      // Edit the report
      await (await CreateReport.getEditButton()).click()

      await (await CreateReport.getTestReferenceFieldLabel()).waitForExist()
      await (await CreateReport.getTestReferenceFieldLabel()).waitForDisplayed()
      // Delete it
      await (await CreateReport.getDeleteButton()).waitForExist()
      await (await CreateReport.getDeleteButton()).waitForDisplayed()
      await (await CreateReport.getDeleteButton()).click()
      // Confirm delete
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      await (await CreateReport.getConfirmButton()).waitForExist()
      await (await CreateReport.getConfirmButton()).waitForDisplayed()
      await (await CreateReport.getConfirmButton()).click()
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      await CreateReport.waitForAlertToLoad()
      expect(await (await CreateReport.getAlert()).getText()).to.include(
        "Report deleted"
      )
    })
  })
})
