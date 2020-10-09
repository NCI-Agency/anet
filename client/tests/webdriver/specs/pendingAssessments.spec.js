// Note: number of assessments are based on the base data, if that changes, change this test as well
import { expect } from "chai"
import MyCounterparts from "../pages/myCounterparts.page"
import MyTasks from "../pages/myTasks.page"

describe("In my counterparts page", () => {
  describe("When Erin is checking the content of the page", () => {
    it("Should see an empty table of pending counterparts", () => {
      MyCounterparts.open()
      MyCounterparts.myPendingCounterparts.waitForDisplayed()
      const myPendingCounterpartsItems = MyCounterparts.myPendingCounterpartsContent.$$(
        "tr"
      )
      expect(myPendingCounterpartsItems).to.have.length(1)
    })
  })
})

describe("In my tasks page", () => {
  describe("When Erin is checking the content of the page", () => {
    it("Should see an empty table of pending tasks", () => {
      MyTasks.open()
      MyTasks.myPendingTasks.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(MyTasks.myPendingTasksContent.isExisting()).to.be.false
    })
  })
})
