import { DEFAULT_SEARCH_PROPS } from "../actions"

const searchProps = (state = DEFAULT_SEARCH_PROPS, action) => {
  switch (action.type) {
    case "SET_SEARCH_PROPS":
      return Object.assign({}, state, action.searchProps)
    default:
      return state
  }
}

export default searchProps
