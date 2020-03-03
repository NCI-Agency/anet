import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import LocationForm from "./Form"

const LocationNew = ({ pageDispatchers }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const location = new Location()

  return <LocationForm initialValues={location} title="Create a new Location" />
}

LocationNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(LocationNew)
