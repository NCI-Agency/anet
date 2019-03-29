import { REPORT_DRAFT } from "../../src/constants"
import * as types from "../../src/constants/ActionTypes"
import reducer from "../../src/reducers/pagination"

describe("pagination reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {})).toEqual({})
  })

  it("should handle SET_PAGINATION", () => {
    expect(
      reducer(undefined, {
        type: types.SET_PAGINATION,
        payload: {
          pageKey: REPORT_DRAFT,
          pageNum: 1
        }
      })
    ).toEqual({
      REPORT_DRAFT: { pageNum: 1 }
    })

    expect(
      reducer(
        {
          REPORT_DRAFT: { pageNum: 1 }
        },
        {
          type: types.SET_PAGINATION,
          payload: {
            pageKey: "REPORT_FUTURE",
            pageNum: 2
          }
        }
      )
    ).toEqual({
      REPORT_DRAFT: { pageNum: 1 },
      REPORT_FUTURE: { pageNum: 2 }
    })

    expect(
      reducer(
        {
          REPORT_DRAFT: { pageNum: 1 },
          REPORT_FUTURE: { pageNum: 2 }
        },
        {
          type: types.SET_PAGINATION,
          payload: {
            pageKey: "REPORT_DRAFT",
            pageNum: 2
          }
        }
      )
    ).toEqual({
      REPORT_DRAFT: { pageNum: 2 },
      REPORT_FUTURE: { pageNum: 2 }
    })
  })
  it("should handle RESET_PAGINATION", () => {
    expect(
      reducer(
        {
          REPORT_DRAFT: { pageNum: 1 },
          SEARCH_REPORT: { pageNum: 2 }
        },
        {
          type: types.RESET_PAGINATION
        }
      )
    ).toEqual({})
  })
})
