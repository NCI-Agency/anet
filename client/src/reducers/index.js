import { loadingBarReducer } from "react-redux-loading-bar"
import { combineReducers } from "redux"
import { RESET_PAGES } from "../constants/ActionTypes"
import pageProps from "./pageProps"
import pagination from "./pagination"
import searchProps from "./searchProps"
import searchQuery from "./searchQuery"

const allReducers = combineReducers({
  loadingBar: loadingBarReducer,
  pageProps,
  searchProps,
  searchQuery,
  pagination
})

const rootReducer = (state, action) => {
  if (action.type === RESET_PAGES) {
    state = undefined
  }

  return allReducers(state, action)
}

export default rootReducer
