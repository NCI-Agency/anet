import { expect, test } from "@playwright/test"
import CreateOrganizationPageObject from "../pages/createNewOrganization.page.js"
import ShowOrganizationPageObject from "../pages/showOrganization.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, CreateOrganization, ShowOrganization
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    CreateOrganization = new CreateOrganizationPageObject(page)
    ShowOrganization = new ShowOrganizationPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const testOrgs = {
    topLevel: {
      shortName: "TO 1",
      description: "Test Organization 1",
      location: "Cabot Tower",
      profile: "Test Organization 1 profile",
      app6contextInput: "1",
      app6context: "Exercise",
      app6standardIdentityInput: "2",
      app6standardIdentity: "Assumed Friend",
      app6symbolSetInput: "10",
      app6symbolSet: "Land Unit",
      app6hqInput: "3",
      app6hq: "Feint/Dummy Headquarters",
      app6amplifierInput: "12",
      app6amplifier: "Squad",
      app6entityInput: "12",
      app6entity: "Movement and Manoeuvre"
    },
    secondLevel: {
      shortName: "TO 1.1",
      description: "Test Organization 1.1",
      location: "General Hospital",
      profile: "Test Organization 1.1 profile",
      app6standardIdentityInput: "3",
      app6standardIdentity: "Friend",
      app6symbolSetInput: "10",
      app6symbolSet: "Land Unit",
      app6hqInput: "5",
      app6hq: "Feint/Dummy Task Force",
      app6amplifierInput: "11",
      app6amplifier: "Team/Crew"
    },
    thirdLevel: {
      shortName: "TO 1.1.1",
      description: "Test Organization 1.1.1",
      location: "Kabul Hospital",
      profile: "Test Organization 1.1.1 profile"
    }
  }
  test.describe("When creating an organization", () => {
    test("Should show name to be required when submitting empty form", async () => {
      await CreateOrganization.openAsAdmin()
      await (
        await CreateOrganization.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await CreateOrganization.submitForm()
      await (
        await CreateOrganization.getOrganizationShortNameHelpBlock()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test("Should be able to create a top-level organization", async () => {
      await CreateOrganization.fillOrganization(testOrgs.topLevel)
      await CreateOrganization.submitForm()
      await ShowOrganization.waitForAlertSuccessToLoad()
      await expect(await ShowOrganization.getAlertSuccess()).toHaveText(
        "Organization saved",
        {
          useInnerText: true
        }
      )
    })
    test("Should display the newly created top-level organization", async () => {
      const testOrg = testOrgs.topLevel
      await expect(await ShowOrganization.getLongName()).toHaveText(
        testOrg.description,
        {
          useInnerText: true
        }
      )
      await expect(await ShowOrganization.getLocation()).toContainText(
        testOrg.location,
        {
          useInnerText: true
        }
      )
      await expect(await ShowOrganization.getProfile()).toContainText(
        testOrg.profile,
        {
          useInnerText: true
        }
      )
      await ShowOrganization.hoverOverApp6Symbol()
      await expect(
        await ShowOrganization.getApp6Value("app6context")
      ).toHaveText(testOrg.app6context, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6standardIdentity")
      ).toHaveText(testOrg.app6standardIdentity, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6symbolSet")
      ).toHaveText(testOrg.app6symbolSet, {
        useInnerText: true
      })
      await expect(await ShowOrganization.getApp6Value("app6hq")).toHaveText(
        testOrg.app6hq,
        {
          useInnerText: true
        }
      )
      await expect(
        await ShowOrganization.getApp6Value("app6amplifier")
      ).toHaveText(testOrg.app6amplifier, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6entity")
      ).toHaveText(testOrg.app6entity, {
        useInnerText: true
      })
    })
    test("Should be able to create a sub-organization for the newly created top-level organization", async () => {
      await (await ShowOrganization.getCreateSubOrganizationButton()).click()
      await (
        await CreateOrganization.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      const topLevelOrg = testOrgs.topLevel
      await expect(
        await CreateOrganization.getParentOrganizationInput()
      ).toHaveValue(topLevelOrg.shortName)
      await CreateOrganization.openEditApp6Modal()
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6context")
      ).toHaveText(`${topLevelOrg.app6context} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection(
          "app6standardIdentity"
        )
      ).toHaveText(`${topLevelOrg.app6standardIdentity} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6symbolSet")
      ).toHaveText(`${topLevelOrg.app6symbolSet} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6hq")
      ).toHaveText("None", {
        useInnerText: true
      })
      await CreateOrganization.closeEditApp6Modal()
      await CreateOrganization.fillOrganization(testOrgs.secondLevel)
      await CreateOrganization.submitForm()
      await ShowOrganization.waitForAlertSuccessToLoad()
      await expect(await ShowOrganization.getAlertSuccess()).toHaveText(
        "Organization saved",
        {
          useInnerText: true
        }
      )
    })
    test("Should display the newly created second-level organization", async () => {
      const testOrg = testOrgs.secondLevel
      await expect(await ShowOrganization.getLongName()).toHaveText(
        testOrg.description,
        {
          useInnerText: true
        }
      )
      await expect(await ShowOrganization.getLocation()).toContainText(
        testOrg.location,
        {
          useInnerText: true
        }
      )
      await expect(await ShowOrganization.getProfile()).toContainText(
        testOrg.profile,
        {
          useInnerText: true
        }
      )
      // This one should be inherited from the top level
      await ShowOrganization.hoverOverApp6Symbol()
      await expect(
        await ShowOrganization.getApp6Value("app6context")
      ).toHaveText(`${testOrgs.topLevel.app6context} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6standardIdentity")
      ).toHaveText(testOrg.app6standardIdentity, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6symbolSet")
      ).toHaveText(testOrg.app6symbolSet, {
        useInnerText: true
      })
      await expect(await ShowOrganization.getApp6Value("app6hq")).toHaveText(
        testOrg.app6hq,
        {
          useInnerText: true
        }
      )
      await expect(
        await ShowOrganization.getApp6Value("app6amplifier")
      ).toHaveText(testOrg.app6amplifier, {
        useInnerText: true
      })
    })
    test("Should be able to create a sub-organization for the newly created second-level organization", async () => {
      await (await ShowOrganization.getCreateSubOrganizationButton()).click()
      await (
        await CreateOrganization.getForm()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      const secondLevelOrg = testOrgs.secondLevel
      await expect(
        await CreateOrganization.getParentOrganizationInput()
      ).toHaveValue(secondLevelOrg.shortName)
      // This one should be inherited from the top level
      await CreateOrganization.openEditApp6Modal()
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6context")
      ).toHaveText(`${testOrgs.topLevel.app6context} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection(
          "app6standardIdentity"
        )
      ).toHaveText(`${secondLevelOrg.app6standardIdentity} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6symbolSet")
      ).toHaveText(`${secondLevelOrg.app6symbolSet} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6hq")
      ).toHaveText("None", {
        useInnerText: true
      })
      await CreateOrganization.closeEditApp6Modal()
      await CreateOrganization.fillOrganization(testOrgs.thirdLevel)
      await (
        await CreateOrganization.getClearParentOrganizationButton()
      ).click()
      await (await CreateOrganization.getShortNameInput()).click()
      await CreateOrganization.openEditApp6Modal()
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6context")
      ).toHaveText("None", {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection(
          "app6standardIdentity"
        )
      ).toHaveText("None", {
        useInnerText: true
      })
      await CreateOrganization.closeEditApp6Modal()

      // Search by uuid as the full-text index may not yet be updated
      const url = await page.url()
      const searchParams = new URL(url).searchParams
      const secondLevelOrgUuid = searchParams.get("parentOrgUuid")
      await CreateOrganization.selectParentOrganizationByText(
        secondLevelOrgUuid,
        secondLevelOrg.shortName
      )
      await CreateOrganization.openEditApp6Modal()
      // This one should be inherited from the top level
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6context")
      ).toHaveText(`${testOrgs.topLevel.app6context} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection(
          "app6standardIdentity"
        )
      ).toHaveText(`${secondLevelOrg.app6standardIdentity} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await CreateOrganization.getApp6DropdownSelection("app6symbolSet")
      ).toHaveText(`${secondLevelOrg.app6symbolSet} (inherited)`, {
        useInnerText: true
      })
      await CreateOrganization.closeEditApp6Modal()
      await CreateOrganization.submitForm()
      await ShowOrganization.waitForAlertSuccessToLoad()
      await expect(await ShowOrganization.getAlertSuccess()).toHaveText(
        "Organization saved",
        {
          useInnerText: true
        }
      )
    })
    test("Should display the newly created third-level organization", async () => {
      const testOrg = testOrgs.thirdLevel
      await expect(await ShowOrganization.getLongName()).toHaveText(
        testOrg.description,
        {
          useInnerText: true
        }
      )
      await expect(await ShowOrganization.getLocation()).toContainText(
        testOrg.location,
        {
          useInnerText: true
        }
      )
      await expect(await ShowOrganization.getProfile()).toContainText(
        testOrg.profile,
        {
          useInnerText: true
        }
      )
      await ShowOrganization.hoverOverApp6Symbol()
      // This one should be inherited from the top level
      await expect(
        await ShowOrganization.getApp6Value("app6context")
      ).toHaveText(`${testOrgs.topLevel.app6context} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6standardIdentity")
      ).toHaveText(`${testOrgs.secondLevel.app6standardIdentity} (inherited)`, {
        useInnerText: true
      })
      await expect(
        await ShowOrganization.getApp6Value("app6symbolSet")
      ).toHaveText(`${testOrgs.secondLevel.app6symbolSet} (inherited)`, {
        useInnerText: true
      })
    })
  })
})
