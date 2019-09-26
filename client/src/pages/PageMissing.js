import { PAGE_PROPS_NO_NAV } from "actions"
import NotFound from "components/NotFound"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import React from "react"
import { connect } from "react-redux"

const PageMissing = props => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    ...props
  })

  return <NotFound text={`Page ${props.match.params[0]} not found.`} />
}

PageMissing.propTypes = { ...pagePropTypes }

export default connect(
  null,
  mapDispatchToProps
)(PageMissing)
