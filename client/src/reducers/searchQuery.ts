import { DEFAULT_SEARCH_QUERY } from "../actions"

const searchQuery = (state = DEFAULT_SEARCH_QUERY, action) => {
  switch (action.type) {
    case "SET_SEARCH_QUERY": {
      return Object.assign({}, state, action.searchQuery)
    }
    case "CLEAR_SEARCH_QUERY":
      return DEFAULT_SEARCH_QUERY
    default:
      return state
  }
}

export default searchQuery
