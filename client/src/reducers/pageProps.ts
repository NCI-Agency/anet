import { DEFAULT_PAGE_PROPS } from "../actions"

const pageProps = (state = DEFAULT_PAGE_PROPS, action) => {
  switch (action.type) {
    case "SET_PAGE_PROPS":
      return action.pageProps
    default:
      return state
  }
}

export default pageProps
