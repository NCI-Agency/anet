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
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()
    })

    it("Should be able to prevent invalid duration values", () => {
      CreateReport.duration.setValue(INVALID_ENGAGEMENT_DURATION_1)
      browser.waitUntil(
        () => {
          return (
            CreateReport.duration.getValue() === VALID_ENGAGEMENT_DURATION_1
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Large positive duration value was not sliced "
        }
      )
      CreateReport.duration.setValue(INVALID_ENGAGEMENT_DURATION_2)
      browser.waitUntil(
        () => {
          return (
            CreateReport.duration.getValue() === VALID_ENGAGEMENT_DURATION_2
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Negative duration value did not change to zero"
        }
      )
    })

    it("Should be able to select an ANET object reference", () => {
      CreateReport.testReferenceFieldLabel.waitForExist()
      CreateReport.testReferenceFieldLabel.waitForDisplayed()
      expect(CreateReport.testReferenceFieldLabel.getText()).to.equal(
        "Related report"
      )
      CreateReport.testReferenceFieldHelpText.waitForExist()
      CreateReport.testReferenceFieldHelpText.waitForDisplayed()
      expect(CreateReport.testReferenceFieldHelpText.getText()).to.equal(
        "Here you can link to a related report"
      )

      // Only input type is Reports, so there should be no button to select a type
      expect(
        CreateReport.testReferenceField.getAttribute("placeholder")
      ).to.equal("Find reports")
      // eslint-disable-next-line no-unused-expressions
      expect(
        CreateReport.testReferenceFieldFormGroup
          .$('//button[text()="Reports"]')
          .isExisting()
      ).to.be.false
      CreateReport.testReferenceFieldLabel.click()
      CreateReport.testReferenceField.setValue(REPORT)
      CreateReport.waitForAdvancedSelectToChange(
        CreateReport.testReferenceFieldAdvancedSelectFirstItem,
        REPORT_COMPLETE
      )
      expect(
        CreateReport.testReferenceFieldAdvancedSelectFirstItem.getText()
      ).to.include(REPORT_COMPLETE)
      CreateReport.testReferenceFieldAdvancedSelectFirstItem.click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testReferenceField.getValue()).to.be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testReferenceFieldValue.isExisting()).to.be.true
      expect(CreateReport.testReferenceFieldValue.getText()).to.include(
        REPORT_VALUE
      )

      // Delete selected value
      CreateReport.testReferenceFieldValue.$("button").click()
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testReferenceFieldValue.isExisting()).to.be.false

      // Select it again
      CreateReport.testReferenceFieldLabel.click()
      CreateReport.testReferenceField.setValue(REPORT)
      CreateReport.waitForAdvancedSelectToChange(
        CreateReport.testReferenceFieldAdvancedSelectFirstItem,
        REPORT_COMPLETE
      )
      CreateReport.testReferenceFieldAdvancedSelectFirstItem.click()
    })

    it("Should be able to select multiple ANET object references", () => {
      CreateReport.testMultiReferenceFieldLabel.waitForExist()
      CreateReport.testMultiReferenceFieldLabel.waitForDisplayed()
      expect(CreateReport.testMultiReferenceFieldLabel.getText()).to.equal(
        "Additional engagement needed for"
      )
      CreateReport.testMultiReferenceFieldHelpText.waitForExist()
      CreateReport.testMultiReferenceFieldHelpText.waitForDisplayed()
      expect(CreateReport.testMultiReferenceFieldHelpText.getText()).to.equal(
        "Here you can link to people, positions and organizations that need an additional engagement"
      )

      // Default input type is People
      expect(
        CreateReport.testMultiReferenceField.getAttribute("placeholder")
      ).to.equal("Find people")
      CreateReport.testMultiReferenceFieldLabel.click()
      CreateReport.testMultiReferenceField.setValue(PERSON)
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
      CreateReport.engagementInformationTitle.click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testMultiReferenceField.getValue()).to.be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testMultiReferenceFieldValue.isExisting()).to.be.true
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(1).getText()
      ).to.include(PERSON_VALUE_1)
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(2).getText()
      ).to.include(PERSON_VALUE_2)

      // Change input type to Positions
      CreateReport.testMultiReferenceFieldFormGroup
        .$('//button[text()="Positions"]')
        .click()
      expect(
        CreateReport.testMultiReferenceField.getAttribute("placeholder")
      ).to.equal("Find positions")
      CreateReport.testMultiReferenceFieldLabel.click()
      CreateReport.testMultiReferenceField.setValue(POSITION)
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
      CreateReport.engagementInformationTitle.click()
      // Advanced select input gets empty, the selected element shown below the input
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testMultiReferenceField.getValue()).to.be.empty
      // Value should exist now
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testMultiReferenceFieldValue.isExisting()).to.be.true
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
      expect(CreateReport.testMultiReferenceFieldValueRows).to.have.lengthOf(5)
      // Delete one of the selected values
      CreateReport.getTestMultiReferenceFieldValueRow(3).$("button").click()
      // Should have only 4 values left
      expect(CreateReport.testMultiReferenceFieldValueRows).to.have.lengthOf(4)
      // 3rd value should have changed
      expect(
        CreateReport.getTestMultiReferenceFieldValueRow(3).getText()
      ).to.include(POSITION_VALUE_2)
    })

    it("Should be able to save a report with ANET object references", () => {
      // Submit the report
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()
      expect(CreateReport.alert.getText()).to.include(
        "The following errors must be fixed"
      )

      // Check ANET object reference
      CreateReport.testReferenceFieldLabel.waitForExist()
      CreateReport.testReferenceFieldLabel.waitForDisplayed()
      expect(CreateReport.testReferenceFieldValue.getText()).to.include(
        REPORT_VALUE
      )

      // Check ANET object multi-references
      CreateReport.testMultiReferenceFieldLabel.waitForExist()
      CreateReport.testMultiReferenceFieldLabel.waitForDisplayed()
      expect(CreateReport.testMultiReferenceFieldValueRows).to.have.lengthOf(4)
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
      CreateReport.editButton.click()

      CreateReport.testReferenceFieldLabel.waitForExist()
      CreateReport.testReferenceFieldLabel.waitForDisplayed()
      // Default input type is People
      expect(
        CreateReport.testReferenceField.getAttribute("placeholder")
      ).to.equal("Find reports")
      // Check ANET object reference
      expect(CreateReport.testReferenceFieldValue.getText()).to.include(
        REPORT_VALUE
      )
      // Delete selected value
      CreateReport.testReferenceFieldValue.$("button").click()

      CreateReport.testMultiReferenceFieldLabel.waitForExist()
      CreateReport.testMultiReferenceFieldLabel.waitForDisplayed()
      // Default input type is People
      expect(
        CreateReport.testMultiReferenceField.getAttribute("placeholder")
      ).to.equal("Find people")
      // Check ANET object multi-references
      expect(CreateReport.testMultiReferenceFieldValueRows).to.have.lengthOf(4)
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
      CreateReport.testMultiReferenceFieldValueRows.forEach(r =>
        r.$("button").click()
      )
    })

    it("Should be able to save a report without any ANET object references", () => {
      // Submit the report
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()
      const alertMessage = CreateReport.alert.getText()
      expect(alertMessage).to.include("The following errors must be fixed")

      // Check ANET object reference
      CreateReport.testReferenceFieldLabel.waitForExist()
      CreateReport.testReferenceFieldLabel.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testReferenceFieldValue.isExisting()).to.be.false

      // Check ANET object multi-references
      CreateReport.testMultiReferenceFieldLabel.waitForExist()
      CreateReport.testMultiReferenceFieldLabel.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(CreateReport.testMultiReferenceFieldValue.isExisting()).to.be.false
    })

    it("Should be able to delete the report", () => {
      // Edit the report
      CreateReport.editButton.click()

      CreateReport.testReferenceFieldLabel.waitForExist()
      CreateReport.testReferenceFieldLabel.waitForDisplayed()
      // Delete it
      CreateReport.deleteButton.waitForExist()
      CreateReport.deleteButton.waitForDisplayed()
      CreateReport.deleteButton.click()
      // Confirm delete
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      CreateReport.confirmButton.waitForExist()
      CreateReport.confirmButton.waitForDisplayed()
      CreateReport.confirmButton.click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      CreateReport.waitForAlertToLoad()
      expect(CreateReport.alert.getText()).to.include("Report deleted")
    })
  })
})
