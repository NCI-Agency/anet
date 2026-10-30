import { expect, test } from "@playwright/test"
import { LoginPage } from "../../e2e/pages/LoginPage.js"
import ShowAllCommunities from "../pages/showAllCommunities.page.js"

const COMMUNITIES_NAMES = [
  "EF 1.1",
  "EF 2.1",
  "EF 2.2",
  "EF 5",
  "Key Advisors",
  "Key Interlocutors",
  "Unlimited exporters"
]
test.describe("Show All Communities Page", () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).login("/", "erin")
  })
  test("Should display all communities", async ({ page }) => {
    const communities = new ShowAllCommunities(page)
    await communities.open()
    // Seven expected names and the original seven-row upper bound imply exactly seven rows.
    await expect(communities.communities).toHaveCount(COMMUNITIES_NAMES.length)
    await expect
      .poll(() => communities.communityNames.allInnerTexts())
      .toEqual(expect.arrayContaining(COMMUNITIES_NAMES))
  })
})
