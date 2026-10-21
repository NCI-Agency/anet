import { expect } from "@playwright/test"
import { v4 as uuidv4 } from "uuid"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page.js"
import { test, waitFor } from "../support.js"

const AUTHORIZATION_GROUP_NAME_PREFIX = "test community"
const AUTHORIZATION_GROUP_DESCRIPTION_PREFIX = "this is just a"
let authorizationGroupName
let authorizationGroupDescription
const POSITION = "anet"
const POSITION_COMPLETE = "ANET Administrator"
const ORGANIZATION = "moi"
const ORGANIZATION_COMPLETE = "MoI | Ministry of Interior"
const PERSON = "jacob"
const PERSON_COMPLETE = "CIV Jacob Jacobson"
const ADMINISTRATIVE_POSITION_1 = "rebecca"
const ADMINISTRATIVE_POSITION_1_COMPLETE = "EF 2.2 Final Reviewer"
const ADMINISTRATIVE_POSITION_2 = "jacob"
const ADMINISTRATIVE_POSITION_2_COMPLETE = "EF 2.2 Superuser"
const POSITION2 = "jack"
const POSITION2_COMPLETE = "EF 2.1 Advisor B"
test.describe("When creating/editing a community", () => {
  test.describe("When creating a community as admin", () => {
    test("Should navigate to the create community page", async () => {
      await CreateAuthorizationGroup.open()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
    })
    test("Should save a community with only a name and description", async () => {
      authorizationGroupName = `${AUTHORIZATION_GROUP_NAME_PREFIX} ${uuidv4()}`
      authorizationGroupDescription = `${AUTHORIZATION_GROUP_DESCRIPTION_PREFIX} ${authorizationGroupName}`
      await (
        await CreateAuthorizationGroup.getName()
      ).fill(String(authorizationGroupName))
      await (
        await CreateAuthorizationGroup.getDescription()
      ).fill(String(authorizationGroupDescription))
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTable()
      ).toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsTable()
      ).toHaveCount(0)
      await waitFor(
        await CreateAuthorizationGroup.getStatusActiveButton(),
        "visible"
      )
      await expect(
        await CreateAuthorizationGroup.getStatusActiveInput()
      ).toHaveValue("ACTIVE")
      await waitFor(
        await CreateAuthorizationGroup.getStatusInactiveButton(),
        "visible"
      )
      await expect(
        await CreateAuthorizationGroup.getStatusInactiveInput()
      ).not.toHaveValue("ACTIVE")
      await (await CreateAuthorizationGroup.getStatusInactiveButton()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
    })
    test("Should save the community with distributionList and forSensitiveInformation", async () => {
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
      await (await CreateAuthorizationGroup.getDistributionList()).click()
      await (
        await CreateAuthorizationGroup.getForSensitiveInformation()
      ).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
      await expect(
        await CreateAuthorizationGroup.getDistributionList()
      ).toHaveText("Yes", {
        useInnerText: true
      })
      await expect(
        await CreateAuthorizationGroup.getForSensitiveInformation()
      ).toHaveText("Yes", {
        useInnerText: true
      })
    })
    test("Should save the community with some members", async () => {
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
      await (await CreateAuthorizationGroup.getRelatedObjectsInput()).click()

      // Add a position
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).fill(String(POSITION))
      await CreateAuthorizationGroup.waitForRelatedObjectsAdvancedSelectToContain(
        POSITION_COMPLETE
      )
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(POSITION_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      // The position is added to a table underneath, so relatedObjects table exists now

      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTable()
      ).not.toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION_COMPLETE
        )
      ).not.toHaveCount(0)

      // Add an organization
      await (
        await CreateAuthorizationGroup.getMemberTypeButton("Organizations")
      ).click()
      await CreateAuthorizationGroup.deleteInput(
        CreateAuthorizationGroup.getRelatedObjectsInput()
      )
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).fill(String(ORGANIZATION))
      await CreateAuthorizationGroup.waitForRelatedObjectsAdvancedSelectToContain(
        ORGANIZATION_COMPLETE
      )
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(ORGANIZATION_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          ORGANIZATION_COMPLETE
        )
      ).not.toHaveCount(0)

      // Add a person
      await (
        await CreateAuthorizationGroup.getMemberTypeButton("People")
      ).click()
      await CreateAuthorizationGroup.deleteInput(
        CreateAuthorizationGroup.getRelatedObjectsInput()
      )
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).fill(String(PERSON))
      await CreateAuthorizationGroup.waitForRelatedObjectsAdvancedSelectToContain(
        PERSON_COMPLETE
      )
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(PERSON_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          PERSON_COMPLETE
        )
      ).not.toHaveCount(0)

      // Click outside the overlay
      await (await CreateAuthorizationGroup.getName()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION_COMPLETE
        )
      ).not.toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          ORGANIZATION_COMPLETE
        )
      ).not.toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          PERSON_COMPLETE
        )
      ).not.toHaveCount(0)
    })
    test("Should save the community with assigned superusers", async () => {
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).click()

      // Add a position
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).fill(String(ADMINISTRATIVE_POSITION_1))
      await CreateAuthorizationGroup.waitForAdministrativePositionsAdvancedSelectToContain(
        ADMINISTRATIVE_POSITION_1_COMPLETE
      )
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
      ).toContainText(ADMINISTRATIVE_POSITION_1_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
      ).click()
      // The position is added to a table underneath, so administrativePositions table exists now

      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsTable()
      ).not.toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
          ADMINISTRATIVE_POSITION_1_COMPLETE
        )
      ).not.toHaveCount(0)

      // Add another position
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).fill(String(ADMINISTRATIVE_POSITION_2))
      await CreateAuthorizationGroup.waitForAdministrativePositionsAdvancedSelectToContain(
        ADMINISTRATIVE_POSITION_2_COMPLETE
      )
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
      ).toContainText(ADMINISTRATIVE_POSITION_2_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateAuthorizationGroup.getAdministrativePositionsAdvancedSelectFirstItem()
      ).click()
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
          ADMINISTRATIVE_POSITION_2_COMPLETE
        )
      ).not.toHaveCount(0)

      // Click outside the overlay
      await (await CreateAuthorizationGroup.getName()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
          ADMINISTRATIVE_POSITION_1_COMPLETE
        )
      ).not.toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsTableEntry(
          ADMINISTRATIVE_POSITION_2_COMPLETE
        )
      ).not.toHaveCount(0)
    })
    test("Should logout again", async () => {
      await CreateAuthorizationGroup.logout()
    })
  })
  test.describe("When editing a community as assigned superuser", () => {
    test("Should navigate to the my communities page", async () => {
      await CreateAuthorizationGroup.openAsSuperuser("/communities/mine")
      await waitFor(
        await CreateAuthorizationGroup.getMyAuthorizationGroups(),
        "visible"
      )
      await (
        await CreateAuthorizationGroup.getAuthorizationGroupLink(
          authorizationGroupName
        )
      ).click()
    })
    test("Should be able to save the community with a changed name and description", async () => {
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
      await (
        await CreateAuthorizationGroup.getName()
      ).fill(`${authorizationGroupName}-edited`)
      await (
        await CreateAuthorizationGroup.getDescription()
      ).fill(`${authorizationGroupDescription}-edited`)
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
      await expect(await CreateAuthorizationGroup.getNameDisplay()).toHaveText(
        `Community ${authorizationGroupName}-edited`,
        {
          useInnerText: true
        }
      )
      await expect(await CreateAuthorizationGroup.getDescription()).toHaveText(
        `${authorizationGroupDescription}-edited`,
        {
          useInnerText: true
        }
      )
    })
    test("Should be able to change the community's distributionList", async () => {
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
      await (await CreateAuthorizationGroup.getDistributionList()).click()
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
      await expect(
        await CreateAuthorizationGroup.getDistributionList()
      ).toHaveText("No", {
        useInnerText: true
      })
    })
    test("Should not be able to change the community's forSensitiveInformation", async () => {
      await (await CreateAuthorizationGroup.getEditButton()).click()
      await waitFor(await CreateAuthorizationGroup.getForm(), "visible")
      await expect(
        await CreateAuthorizationGroup.getForSensitiveInformation()
      ).toBeDisabled()
    })
    test("Should not be able to change the community's assigned superusers", async () => {
      // Should not be able to add administrative positions

      await expect(
        await CreateAuthorizationGroup.getAdministrativePositionsInput()
      ).toHaveCount(0)
      // Should not be able to remove administrative positions

      await expect(
        await (
          await CreateAuthorizationGroup.getAdministrativePositionsTable()
        )
          .locator("button")
          .first()
      ).toHaveCount(0)
    })
    test("Should be able to save the community with changed members", async () => {
      // Add a position
      await (
        await CreateAuthorizationGroup.getRelatedObjectsInput()
      ).fill(String(POSITION2))
      await CreateAuthorizationGroup.waitForRelatedObjectsAdvancedSelectToContain(
        POSITION2_COMPLETE
      )
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(POSITION2_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateAuthorizationGroup.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION2_COMPLETE
        )
      ).not.toHaveCount(0)

      // Remove a position
      const adminPosition =
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION_COMPLETE
        )
      await (
        await adminPosition
          .locator("..")
          .locator("..")
          .locator("..")
          .locator("..")
          .locator("xpath=./td/button")
          .first()
      ).click()
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION_COMPLETE
        )
      ).toHaveCount(0)
      await CreateAuthorizationGroup.submitForm()
      await CreateAuthorizationGroup.waitForAlertSuccessToLoad()
      await expect(await CreateAuthorizationGroup.getAlertSuccess()).toHaveText(
        "Community saved",
        { useInnerText: true }
      )
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION2_COMPLETE
        )
      ).not.toHaveCount(0)
      await expect(
        await CreateAuthorizationGroup.getRelatedObjectsTableEntry(
          POSITION_COMPLETE
        )
      ).toHaveCount(0)
    })
    test("Should logout again", async () => {
      await CreateAuthorizationGroup.logout()
    })
  })
})
