import { expect } from "@playwright/test"
import ShowAllCommunities from "../pages/showAllCommunities.page.js"
import { test } from "../support.js"

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
  test.beforeEach(async () => {
    await ShowAllCommunities.open()
  })
  test("Should display all communities", async () => {
    const communities = await ShowAllCommunities.getCommunitiesList()
    expect(communities.length).toBeGreaterThanOrEqual(1)
    expect(communities.length).toBeLessThanOrEqual(7)
    const communitiesNames = await ShowAllCommunities.getCommunitiesNames()
    expect(communitiesNames).toEqual(expect.arrayContaining(COMMUNITIES_NAMES))
  })
})
