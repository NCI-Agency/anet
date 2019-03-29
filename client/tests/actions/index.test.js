import * as actions from "../../src/actions"
import * as types from "../../src/constants/ActionTypes"

describe("actions", () => {
  it("should create an action to set the pagination", () => {
    const pageNum = 1
    const pageKey = "REPORT_DRAFT"
    const expectedAction = {
      type: types.SET_PAGINATION,
      payload: {
        pageKey,
        pageNum
      }
    }
    expect(actions.setPagination("REPORT_DRAFT", pageNum)).toEqual(
      expectedAction
    )
  })
  it("should create an action to `reset` the pagination", () => {
    const expectedAction = {
      type: types.RESET_PAGINATION
    }
    expect(actions.resetPagination()).toEqual(expectedAction)
  })
  it("should create an action to `reset` all the pages redux stores", () => {
    const expectedAction = {
      type: types.RESET_PAGES
    }
    expect(actions.resetPages()).toEqual(expectedAction)
  })
})
