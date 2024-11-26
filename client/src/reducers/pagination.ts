import { RESET_PAGINATION, SET_PAGINATION } from "../constants/ActionTypes"

const initialState = {}

const pages = (state = initialState, action) => {
  switch (action.type) {
    case SET_PAGINATION: {
      const { paginationKey, pageNum } = action.payload
      return {
        ...state,
        [paginationKey]: {
          pageNum
        }
      }
    }
    case RESET_PAGINATION:
      return {}
    default:
      return state
  }
}

export default pages
