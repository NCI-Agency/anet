import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import NotFound from "components/NotFound"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"

const PageMissing = props => {
  const params = useParams()
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })

  return <NotFound text={`Page ${params[0]} not found.`} />
}

PageMissing.propTypes = { ...pagePropTypes }

export default connect(
  null,
  mapDispatchToProps
)(PageMissing)
