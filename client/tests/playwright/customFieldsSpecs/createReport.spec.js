import { expect } from "@playwright/test"
import CreateReport from "../pages/createReport.page.js"
import { test, waitFor, waitUntil } from "../support.js"

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
const SEARCH_PEOPLE_COMPLETE_1 = "CIV Lin Guist"
const SEARCH_ORGANIZATION_COMPLETE = "LNG | Linguistic"
const SEARCH_POSITION_COMPLETE_1 = "LNG Advisor A"
const PERSON = "EF 2.1"
const PERSON_VALUE_1 = "Henry Henderson"
const PERSON_VALUE_2 = "Jack Jackson"
const PERSON_COMPLETE_1 = `OF-6 ${PERSON_VALUE_1}`
const PERSON_COMPLETE_2 = `OF-9 ${PERSON_VALUE_2}`
const POSITION = "MOD-FO"
const POSITION_VALUE_1 = "Chief of Staff - MoD"
const POSITION_VALUE_2 = "Executive Assistant to the MoD"
const POSITION_VALUE_3 = "Minister of Defense"
const POSITION_COMPLETE_1 = `${POSITION_VALUE_1}, MOD-FO-00002`
const POSITION_COMPLETE_2 = `${POSITION_VALUE_2}`
const POSITION_COMPLETE_3 = `${POSITION_VALUE_3}`
test.describe("Create report form page", () => {
  test.describe("When creating a report", () => {
    test("Should be able to load the form", async () => {
      await CreateReport.open()
      // wait for the page transition and rendering of custom fields
      await waitFor(await CreateReport.getForm(), "visible")
    })
    test("Should be able to set the grid location", async () => {
      await (
        await CreateReport.getGridLocationLatField()
      ).fill(String(GRID_LOCATION.lat))
      await (
        await CreateReport.getGridLocationLngField()
      ).fill(String(GRID_LOCATION.lng))
      await (await CreateReport.getGridLocationInfoButton()).click()
      await (await CreateReport.getGridLocationMgrsButton()).click()
      await expect(
        await CreateReport.getGridLocationDisplayedCoordinateField()
      ).toHaveValue(GRID_LOCATION.displayedCoordinate)
      await (await CreateReport.getGridLocationInfoButton()).click()
      await (await CreateReport.getGridLocationLatLonButton()).click()
      await expect(await CreateReport.getGridLocationLatField()).toHaveValue(
        GRID_LOCATION.lat
      )
      await expect(await CreateReport.getGridLocationLngField()).toHaveValue(
        GRID_LOCATION.lng
      )
    })
    test("Should be able to prevent invalid duration values", async () => {
      await (
        await CreateReport.getDuration()
      ).fill(String(INVALID_ENGAGEMENT_DURATION_1))
      await waitUntil(
        async () => {
          return (
            (await (await CreateReport.getDuration()).inputValue()) ===
            VALID_ENGAGEMENT_DURATION_1
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Large positive duration value was not sliced"
        }
      )
      await (
        await CreateReport.getDuration()
      ).fill(String(INVALID_ENGAGEMENT_DURATION_2))
      await waitUntil(
        async () => {
          return (
            (await (await CreateReport.getDuration()).inputValue()) ===
            VALID_ENGAGEMENT_DURATION_2
          )
        },
        {
          timeout: 3000,
          timeoutMsg: "Negative duration value did not change to zero"
        }
      )
    })
    test("Should be able to select an ANET object reference", async () => {
      await waitFor(await CreateReport.getTestReferenceFieldLabel(), "visible")
      await expect(await CreateReport.getTestReferenceFieldLabel()).toHaveText(
        "Related report",
        {
          useInnerText: true
        }
      )
      await waitFor(
        await CreateReport.getTestReferenceFieldHelpText(),
        "visible"
      )
      await expect(
        await CreateReport.getTestReferenceFieldHelpText()
      ).toHaveText("Here you can link to a related report", {
        useInnerText: true
      })

      // Only input type is Reports, so there should be no button to select a type
      await expect(await CreateReport.getTestReferenceField()).toHaveAttribute(
        "placeholder",
        "Find reports"
      )
      await expect(
        await CreateReport.getTestReferenceFieldButton("Reports")
      ).toHaveCount(0)
      await (await CreateReport.getTestReferenceFieldLabel()).click()
      await (await CreateReport.getTestReferenceField()).fill(String(REPORT))
      await CreateReport.waitForElementToChange(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem,
        REPORT_COMPLETE
      )
      await expect(
        await CreateReport.getTestReferenceFieldAdvancedSelectFirstItem()
      ).toContainText(REPORT_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateReport.getTestReferenceFieldAdvancedSelectFirstItem()
      ).click()
      // The selected element should be shown below the input

      await expect(
        await CreateReport.getTestReferenceFieldValue()
      ).not.toHaveCount(0)
      await expect(
        await CreateReport.getTestReferenceFieldValue()
      ).toContainText(REPORT_VALUE, {
        useInnerText: true
      })

      // Delete selected value
      await (
        await (
          await CreateReport.getTestReferenceFieldValue()
        )
          .locator("button")
          .first()
      ).click()
      await expect(await CreateReport.getTestReferenceFieldValue()).toHaveCount(
        0
      )

      // Select it again
      await (await CreateReport.getTestReferenceFieldLabel()).click()
      await CreateReport.deleteInput(await CreateReport.getTestReferenceField())
      await (await CreateReport.getTestReferenceField()).fill(String(REPORT))
      await CreateReport.waitForElementToChange(
        CreateReport.getTestReferenceFieldAdvancedSelectFirstItem,
        REPORT_COMPLETE
      )
      await (
        await CreateReport.getTestReferenceFieldAdvancedSelectFirstItem()
      ).click()
    })
    test("Should be able to select multiple ANET object references", async () => {
      await waitFor(
        await CreateReport.getTestMultiReferenceFieldLabel(),
        "visible"
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).toHaveText("Additional engagement needed for", {
        useInnerText: true
      })
      await waitFor(
        await CreateReport.getTestMultiReferenceFieldHelpText(),
        "visible"
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldHelpText()
      ).toHaveText(
        "Here you can link to people, positions and organizations that need an additional engagement",
        {
          useInnerText: true
        }
      )

      // Check search query does not reset when changing object type
      // Default input type is People
      await (
        await CreateReport.getTestMultiReferenceFieldButton("People")
      ).scrollIntoViewIfNeeded()
      await expect(
        await CreateReport.getTestMultiReferenceField()
      ).toHaveAttribute("placeholder", "Find people")
      await (await CreateReport.getTestMultiReferenceFieldLabel()).click()
      await (
        await CreateReport.getTestMultiReferenceField()
      ).fill(String(SEARCH_KEY))
      await CreateReport.waitForElementToChange(
        () => CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        SEARCH_PEOPLE_COMPLETE_1
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1)
      ).toContainText(SEARCH_PEOPLE_COMPLETE_1, {
        useInnerText: true
      })
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Change input type to Organizations
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Organizations")
      ).scrollIntoViewIfNeeded()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Organizations")
      ).click()
      // Wait for the filters to change

      await expect(
        await CreateReport.getTestMultiReferenceField()
      ).toHaveAttribute("placeholder", "Find organizations")
      await (await CreateReport.getTestMultiReferenceField()).click()
      await expect(await CreateReport.getTestMultiReferenceField()).toHaveValue(
        SEARCH_KEY
      )
      await CreateReport.waitForElementToChange(
        () => CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        SEARCH_ORGANIZATION_COMPLETE
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1)
      ).toContainText(SEARCH_ORGANIZATION_COMPLETE, {
        useInnerText: true
      })
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Change input type to Positions
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).scrollIntoViewIfNeeded()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).click()
      // Wait for the filters to change

      await expect(
        await CreateReport.getTestMultiReferenceField()
      ).toHaveAttribute("placeholder", "Find positions")
      await (await CreateReport.getTestMultiReferenceField()).click()
      await expect(await CreateReport.getTestMultiReferenceField()).toHaveValue(
        SEARCH_KEY
      )
      await CreateReport.waitForElementToChange(
        () => CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        SEARCH_POSITION_COMPLETE_1
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1)
      ).toContainText(SEARCH_POSITION_COMPLETE_1, {
        useInnerText: true
      })
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Advanced select input does not get empty
      await expect(await CreateReport.getTestMultiReferenceField()).toHaveValue(
        SEARCH_KEY
      )
      // Change input type to People
      await (
        await CreateReport.getTestMultiReferenceFieldButton("People")
      ).scrollIntoViewIfNeeded()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("People")
      ).click()
      // Wait for the filters to change

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
      await expect(
        await CreateReport.getTestMultiReferenceField()
      ).toHaveAttribute("placeholder", "Find people")
      await (await CreateReport.getTestMultiReferenceField()).click()
      // After preserving search query, setValue does not work consistently
      // input field values are sometimes concatenated
      // Therefore, clear input field previous value before setting new value.
      await CreateReport.deleteInput(
        await CreateReport.getTestMultiReferenceField()
      )
      await (
        await CreateReport.getTestMultiReferenceField()
      ).fill(String(PERSON))
      await CreateReport.waitForElementToChange(
        () => CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        PERSON_COMPLETE_1
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1)
      ).toContainText(PERSON_COMPLETE_1, {
        useInnerText: true
      })
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(1)
      ).click()
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(2)
      ).toContainText(PERSON_COMPLETE_2, {
        useInnerText: true
      })
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(2)
      ).click()
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Advanced select input does not get empty, the selected element shown below the input
      await expect(await CreateReport.getTestMultiReferenceField()).toHaveValue(
        PERSON
      )
      // Value should exist now

      await expect(
        await CreateReport.getTestMultiReferenceFieldValue()
      ).not.toHaveCount(0)
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(1)
      ).toContainText(PERSON_VALUE_1, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(2)
      ).toContainText(PERSON_VALUE_2, {
        useInnerText: true
      })

      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Change input type to Positions
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).scrollIntoViewIfNeeded()
      await (
        await CreateReport.getTestMultiReferenceFieldButton("Positions")
      ).click()
      // Wait for the filters to change

      await expect(
        await CreateReport.getTestMultiReferenceField()
      ).toHaveAttribute("placeholder", "Find positions")
      await (await CreateReport.getTestMultiReferenceField()).click()
      // After preserving search query, setValue does not work consistently
      // input field values are sometimes concatenated
      // Therefore, clear input field previous value before setting new value.
      await CreateReport.deleteInput(
        await CreateReport.getTestMultiReferenceField()
      )
      await (
        await CreateReport.getTestMultiReferenceField()
      ).fill(String(POSITION))
      await CreateReport.waitForElementToChange(
        () => CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1),
        POSITION_COMPLETE_1
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(1)
      ).toContainText(POSITION_COMPLETE_1, {
        useInnerText: true
      })
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(1)
      ).click()
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(2)
      ).toContainText(POSITION_COMPLETE_2, {
        useInnerText: true
      })
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(2)
      ).click()
      await expect(
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItemLabel(3)
      ).toContainText(POSITION_COMPLETE_3, {
        useInnerText: true
      })
      await (
        await CreateReport.getTestMultiReferenceFieldAdvancedSelectItem(3)
      ).click()
      // Click outside the overlay
      await (await CreateReport.getEngagementInformationTitle()).click()
      // Advanced select input does not get empty, the selected element shown below the input
      await expect(await CreateReport.getTestMultiReferenceField()).toHaveValue(
        POSITION
      )
      // Value should exist now

      await expect(
        await CreateReport.getTestMultiReferenceFieldValue()
      ).not.toHaveCount(0)
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(3)
      ).toContainText(POSITION_VALUE_1, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(4)
      ).toContainText(POSITION_VALUE_2, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(5)
      ).toContainText(POSITION_VALUE_3, {
        useInnerText: true
      })

      // Should have 5 values
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).toHaveLength(5)
      // Delete one of the selected values
      await (
        await (
          await CreateReport.getTestMultiReferenceFieldValueRow(3)
        )
          .locator("button")
          .first()
      ).click()
      // Should have only 4 values left
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).toHaveLength(4)
      // 3rd value should have changed
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(3)
      ).toContainText(POSITION_VALUE_2, {
        useInnerText: true
      })
    })
    test("Should be able to save a report with ANET object references", async () => {
      // Submit the report
      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()
      await expect(await CreateReport.getAlertDanger()).toContainText(
        "The following errors must be fixed",
        {
          useInnerText: true
        }
      )

      // Check ANET object reference
      await waitFor(await CreateReport.getTestReferenceFieldLabel(), "visible")
      await expect(
        await CreateReport.getTestReferenceFieldValue()
      ).toContainText(REPORT_VALUE, {
        useInnerText: true
      })

      // Check ANET object multi-references
      await waitFor(
        await CreateReport.getTestMultiReferenceFieldLabel(),
        "visible"
      )
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).toHaveLength(4)
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(1)
      ).toContainText(PERSON_VALUE_1, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(2)
      ).toContainText(PERSON_VALUE_2, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(3)
      ).toContainText(POSITION_VALUE_2, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(4)
      ).toContainText(POSITION_VALUE_3, {
        useInnerText: true
      })
    })
    test("Should be able to edit a report with ANET object references", async () => {
      // Edit the report
      await (await CreateReport.getEditButton()).click()
      await waitFor(await CreateReport.getTestReferenceFieldLabel(), "visible")
      // Default input type is People
      await expect(await CreateReport.getTestReferenceField()).toHaveAttribute(
        "placeholder",
        "Find reports"
      )
      // Check ANET object reference
      await expect(
        await CreateReport.getTestReferenceFieldValue()
      ).toContainText(REPORT_VALUE, {
        useInnerText: true
      })
      // Delete selected value
      await (
        await CreateReport.getTestReferenceFieldValue()
      ).scrollIntoViewIfNeeded()
      await (
        await (
          await CreateReport.getTestReferenceFieldValue()
        )
          .locator("button")
          .first()
      ).click()
      await waitFor(
        await CreateReport.getTestMultiReferenceFieldLabel(),
        "visible"
      )
      await (
        await CreateReport.getTestMultiReferenceFieldLabel()
      ).scrollIntoViewIfNeeded()
      // Default input type is People
      await expect(
        await CreateReport.getTestMultiReferenceField()
      ).toHaveAttribute("placeholder", "Find people")
      // Check ANET object multi-references
      expect(
        await CreateReport.getTestMultiReferenceFieldValueRows()
      ).toHaveLength(4)
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(1)
      ).toContainText(PERSON_VALUE_1, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(2)
      ).toContainText(PERSON_VALUE_2, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(3)
      ).toContainText(POSITION_VALUE_2, {
        useInnerText: true
      })
      await expect(
        await CreateReport.getTestMultiReferenceFieldValueRow(4)
      ).toContainText(POSITION_VALUE_3, {
        useInnerText: true
      })
      // Delete selected values
      const selectedValues =
        await CreateReport.getTestMultiReferenceFieldValue()
      const unlinkButtons = selectedValues.locator("tbody tr button")
      while (await unlinkButtons.count()) {
        await unlinkButtons.first().click()
      }
    })
    test("Should be able to save a report without any ANET object references", async () => {
      // Submit the report
      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()
      await expect(await CreateReport.getAlertDanger()).toContainText(
        "The following errors must be fixed",
        { useInnerText: true }
      )

      // Check ANET object reference
      await waitFor(await CreateReport.getTestReferenceFieldLabel(), "visible")
      await expect(await CreateReport.getTestReferenceFieldValue()).toHaveCount(
        0
      )

      // Check ANET object multi-references
      await waitFor(
        await CreateReport.getTestMultiReferenceFieldLabel(),
        "visible"
      )
      await expect(
        await CreateReport.getTestMultiReferenceFieldValue()
      ).toHaveCount(0)
    })
    test("Should be able to delete the report", async () => {
      // Edit the report
      await (await CreateReport.getEditButton()).click()
      await waitFor(await CreateReport.getTestReferenceFieldLabel(), "visible")
      // Delete it
      await (await CreateReport.getDeleteButton()).click()
      // Confirm delete

      // wait for the modal to slide in (transition is 300 ms)
      await (await CreateReport.getConfirmButton()).click()
      // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      await CreateReport.waitForAlertToLoad()
      await expect(await CreateReport.getAlertSuccess()).toContainText(
        "Report deleted",
        {
          useInnerText: true
        }
      )
    })
  })
})
