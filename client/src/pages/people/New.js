import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import { Person } from "models"
import React from "react"
import { connect } from "react-redux"
import PersonForm from "./Form"

const PersonNew = props => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })

  const person = new Person()

  return <PersonForm initialValues={person} title="Create a new Person" />
}

PersonNew.propTypes = {
  ...pagePropTypes
}

export default connect(null, mapDispatchToProps)(PersonNew)
