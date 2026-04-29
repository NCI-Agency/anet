import { expect } from "chai"
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

describe("Show All Communities Page", () => {
  beforeEach(async () => {
    await ShowAllCommunities.open()
  })

  it("Should display all communities", async () => {
    const communities = await ShowAllCommunities.getCommunitiesList()
    expect(communities.length).to.be.within(1, 7)
    const communitiesNames = await ShowAllCommunities.getCommunitiesNames()
    expect(communitiesNames).to.include.members(COMMUNITIES_NAMES)
  })
})
