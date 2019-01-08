import * as actions from '../actions'
import * as types from '../constants/ActionTypes'

describe('actions', () => {
  it('should create an action to set the pagination', () => {
    const pageNum = 1
    const pageKey = 'REPORT_DRAFT'
    const expectedAction = {
      type: types.SET_PAGINATION,
      payload: {
        pageKey,
        pageNum
      }
    }
    expect(actions.setPagination('REPORT_DRAFT', pageNum)).toEqual(expectedAction)
  })
})
