import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import NotFound from "components/NotFound"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"

const PageMissing = ({ pageDispatchers }) => {
  const params = useParams()
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return <NotFound text={`Page ${params[0]} not found.`} />
}

PageMissing.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PageMissing)
