import { PAGE_PROPS_NO_NAV } from "actions"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import LocationForm from "./Form"

const LocationNew = props => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    ...props
  })

  const location = new Location()

  return <LocationForm initialValues={location} title="Create a new Location" />
}

LocationNew.propTypes = {
  ...pagePropTypes
}

export default connect(
  null,
  mapDispatchToProps
)(LocationNew)
