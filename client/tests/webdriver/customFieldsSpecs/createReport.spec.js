import { expect } from "chai"
import CreateReport from "../pages/createReport.page"

const REPORT = "Interior"
const REPORT_VALUE = "Talk to the Interior about things"
const REPORT_COMPLETE = `${REPORT_VALUE}`

const INVALID_ENGAGEMENT_DURATION_1 = "123456"
const INVALID_ENGAGEMENT_DURATION_2 = "-1"
// positive sliced at 4th digit, negative should turn into 0
const VALID_ENGAGEMENT_DURATION_1 = "1234"
const VALID_ENGAGEMENT_DURATION_2 = "0"

const PERSON = "EF 2.1"
const PERSON_VALUE_1 = "HENDERSON, Henry"
const PERSON_VALUE_2 = "JACKSON, Jack"
const PERSON_COMPLETE_1 = `BGen ${PERSON_VALUE_1}`
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
    it("Should be able to load the form", () => {
      CreateReport.open()
      browser.pause(500) // wait for the page transition and rendering of custom fields
      CreateReport.getForm().waitForExist()
      CreateReport.getForm().waitForDisplayed()
    })

    it("Should be able to prevent invalid duration values", () => {
      CreateReport.getDuration().setValue(INVALID_ENGAGEMENT_DURATION_1)
      browser.waitUntil(
        () => {
          return (
            CreateReport.getDuration().getValue() ===
            VALID_ENGAGEMENT_DURATION_1
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Large positive duration value was not sliced "
        }
      )
      CreateReport.getDuration().setValue(INVALID_ENGAGEMENT_DURATION_2)
      browser.waitUntil(
        () => {
          return (
            CreateReport.getDuration().getValue() ===
            VALID_ENGAGEMENT_DURATION_2
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Negative duration value did not change to zero"
        }
      )
    })

    it("Should be able to select an ANET object reference", () => {
      CreateReport.getTestReferenceFieldLabel().waitForExist()
      CreateReport.getTestReferenceFieldLabel().waitForDisplayed()
      expect(CreateReport.getTestReferenceFieldLabel().getText()).to.equal(
        "Related report"
      )
      CreateReport.getTestReferenceFieldHelpText().waitForExist()
      CreateReport.getTestReferenceFieldHelpText().waitForDisplayed()
      expect(CreateReport.getTestReferenceFieldHelpText().getText()).to.equal(
        "Here you can link to a related report"
      )

      // Only input type is Reports, so there should be no button to select a type
      expect(
        CreateReport.getTestReferenceField().getAttribute("placeholder")
      ).to.equal("Find reports")
      // eslint-disable-next-line no-unused-expressions
      expect(
        CreateReport.getTestReferenceFieldFormGroup()
          .$('//button[text()="Reports"]')
          .isExisting()
      ).to.be.false
      CreateReport.getTestReferenceFieldLabel().click()
      CreateReport.getTestReferenceField().setValue(REPORT)
      CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem(),
        REPORT_COMPLETE
      )
      expect(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem().getText()
      ).to.include(REPORT_COMPLETE)
      CreateReport.getTestReferenceFieldAdvancedSelectFirstItem().click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestReferenceField().getValue()).to.be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestReferenceFieldValue().isExisting()).to.be.true
      expect(CreateReport.getTestReferenceFieldValue().getText()).to.include(
        REPORT_VALUE
      )

      // Delete selected value
      CreateReport.getTestReferenceFieldValue().$("button").click()
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestReferenceFieldValue().isExisting()).to.be.false

      // Select it again
      CreateReport.getTestReferenceFieldLabel().click()
      CreateReport.getTestReferenceField().setValue(REPORT)
      CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem(),
        REPORT_COMPLETE
      )
      CreateReport.getTestReferenceFieldAdvancedSelectFirstItem().click()
    })

    it("Should be able to select multiple ANET object references", () => {
      CreateReport.getTestMultiReferenceFieldLabel().waitForExist()
      CreateReport.getTestMultiReferenceFieldLabel().waitForDisplayed()
      expect(CreateReport.getTestMultiReferenceFieldLabel().getText()).to.equal(
        "Additional engagement needed for"
      )
      CreateReport.getTestMultiReferenceFieldHelpText().waitForExist()
      CreateReport.getTestMultiReferenceFieldHelpText().waitForDisplayed()
      expect(
        CreateReport.getTestMultiReferenceFieldHelpText().getText()
      ).to.equal(
        "Here you can link to people, positions and organizations that need an additional engagement"
      )

      // Default input type is People
      expect(
        CreateReport.getTestMultiReferenceField().getAttribute("placeholder")
      ).to.equal("Find people")
      CreateReport.getTestMultiReferenceFieldLabel().click()
      CreateReport.getTestMultiReferenceField().setValue(PERSON)
      CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        PERSON_COMPLETE_1
      )
      expect(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
          1
        ).getText()
      ).to.include(PERSON_COMPLETE_1)
      CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(1).click()
      expect(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
          2
        ).getText()
      ).to.include(PERSON_COMPLETE_2)
      CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(2).click()
      // Click outside the overlay
      CreateReport.getEngagementInformationTitle().click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestMultiReferenceField().getValue()).to.be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestMultiReferenceFieldValue().isExisting()).to.be
        .true
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(1).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(2).getText()
      ).to.include(PERSON_VALUE_2)

      // Change input type to Positions
      CreateReport.getTestMultiReferenceFieldFormGroup()
        .$('//button[text()="Positions"]')
        .click()
      expect(
        CreateReport.getTestMultiReferenceField().getAttribute("placeholder")
      ).to.equal("Find positions")
      CreateReport.getTestMultiReferenceFieldLabel().click()
      CreateReport.getTestMultiReferenceField().setValue(POSITION)
      CreateReport.waitForAdvancedSelectToChange(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        POSITION_COMPLETE_1
      )
      expect(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
          1
        ).getText()
      ).to.include(POSITION_COMPLETE_1)
      CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(1).click()
      expect(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
          2
        ).getText()
      ).to.include(POSITION_COMPLETE_2)
      CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(2).click()
      expect(
        CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(
          3
        ).getText()
      ).to.include(POSITION_COMPLETE_3)
      CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(3).click()
      // Click outside the overlay
      CreateReport.getEngagementInformationTitle().click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestMultiReferenceField().getValue()).to.be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestMultiReferenceFieldValue().isExisting()).to.be
        .true
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(3).getText()
      ).to.include(POSITION_VALUE_1)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(4).getText()
      ).to.include(POSITION_VALUE_2)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(5).getText()
      ).to.include(POSITION_VALUE_3)

      // Should have 5 values
      expect(
        CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(5)
      // Delete one of the selected values
      CreateReport.getTestMultiReferenceFieldValueRow(3).$("button").click()
      // Should have only 4 values left
      expect(
        CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(4)
      // 3rd value should have changed
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(3).getText()
      ).to.include(POSITION_VALUE_2)
    })

    it("Should be able to save a report with ANET object references", () => {
      // Submit the report
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()
      expect(CreateReport.getAlert().getText()).to.include(
        "The following errors must be fixed"
      )

      // Check ANET object reference
      CreateReport.getTestReferenceFieldLabel().waitForExist()
      CreateReport.getTestReferenceFieldLabel().waitForDisplayed()
      expect(CreateReport.getTestReferenceFieldValue().getText()).to.include(
        REPORT_VALUE
      )

      // Check ANET object multi-references
      CreateReport.getTestMultiReferenceFieldLabel().waitForExist()
      CreateReport.getTestMultiReferenceFieldLabel().waitForDisplayed()
      expect(
        CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(4)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(1).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(2).getText()
      ).to.include(PERSON_VALUE_2)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(3).getText()
      ).to.include(POSITION_VALUE_2)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(4).getText()
      ).to.include(POSITION_VALUE_3)
    })

    it("Should be able to edit a report with ANET object references", () => {
      // Edit the report
      CreateReport.getEditButton().click()

      CreateReport.getTestReferenceFieldLabel().waitForExist()
      CreateReport.getTestReferenceFieldLabel().waitForDisplayed()
      // Default input type is People
      expect(
        CreateReport.getTestReferenceField().getAttribute("placeholder")
      ).to.equal("Find reports")
      // Check ANET object reference
      expect(CreateReport.getTestReferenceFieldValue().getText()).to.include(
        REPORT_VALUE
      )
      // Delete selected value
      CreateReport.getTestReferenceFieldValue().scrollIntoView()
      CreateReport.getTestReferenceFieldValue().$("button").click()

      CreateReport.getTestMultiReferenceFieldLabel().waitForExist()
      CreateReport.getTestMultiReferenceFieldLabel().waitForDisplayed()
      CreateReport.getTestMultiReferenceFieldLabel().scrollIntoView()
      // Default input type is People
      expect(
        CreateReport.getTestMultiReferenceField().getAttribute("placeholder")
      ).to.equal("Find people")
      // Check ANET object multi-references
      expect(
        CreateReport.getTestMultiReferenceFieldValueRows()
      ).to.have.lengthOf(4)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(1).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(2).getText()
      ).to.include(PERSON_VALUE_2)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(3).getText()
      ).to.include(POSITION_VALUE_2)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(4).getText()
      ).to.include(POSITION_VALUE_3)
      // Delete selected values
      CreateReport.getTestMultiReferenceFieldValueRows().forEach(r => {
        const button = r.$("button")
        button.scrollIntoView()
        button.click()
      })
    })

    it("Should be able to save a report without any ANET object references", () => {
      // Submit the report
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()
      const alertMessage = CreateReport.getAlert().getText()
      expect(alertMessage).to.include("The following errors must be fixed")

      // Check ANET object reference
      CreateReport.getTestReferenceFieldLabel().waitForExist()
      CreateReport.getTestReferenceFieldLabel().waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestReferenceFieldValue().isExisting()).to.be.false

      // Check ANET object multi-references
      CreateReport.getTestMultiReferenceFieldLabel().waitForExist()
      CreateReport.getTestMultiReferenceFieldLabel().waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.getTestMultiReferenceFieldValue().isExisting()).to.be
        .false
    })

    it("Should be able to delete the report", () => {
      // Edit the report
      CreateReport.getEditButton().click()

      CreateReport.getTestReferenceFieldLabel().waitForExist()
      CreateReport.getTestReferenceFieldLabel().waitForDisplayed()
      // Delete it
      CreateReport.getDeleteButton().waitForExist()
      CreateReport.getDeleteButton().waitForDisplayed()
      CreateReport.getDeleteButton().click()
      // Confirm delete
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      CreateReport.getConfirmButton().waitForExist()
      CreateReport.getConfirmButton().waitForDisplayed()
      CreateReport.getConfirmButton().click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      CreateReport.waitForAlertToLoad()
      expect(CreateReport.getAlert().getText()).to.include("Report deleted")
    })
  })
})
