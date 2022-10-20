import { loadingBarReducer } from "react-redux-loading-bar"
import { combineReducers } from "redux"
import { RESET_PAGES } from "../constants/ActionTypes"
import pageProps from "./pageProps"
import pagination from "./pagination"
import searchProps from "./searchProps"
import searchQuery from "./searchQuery"
import userActivitiesState from "./userActivitiesState"

const allReducers = combineReducers({
  loadingBar: loadingBarReducer,
  pageProps,
  searchProps,
  searchQuery,
  pagination,
  userActivitiesState
})

const rootReducer = (state, action) => {
  if (action.type === RESET_PAGES) {
    state = undefined
  }

  return allReducers(state, action)
}

export default rootReducer
