import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import NotFound from "components/NotFound"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import React from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router"

interface PageMissingProps {
  pageDispatchers?: PageDispatchersPropType
}

const PageMissing = ({ pageDispatchers }: PageMissingProps) => {
  const params = useParams()
  const { pathname } = useLocation()
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Page not found")
  const page = params?.[0] ?? params?.["*"] ?? pathname ?? ""

  return <NotFound text={`Page ${page} not found.`} />
}

export default connect(null, mapPageDispatchersToProps)(PageMissing)
