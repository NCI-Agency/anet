import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import { initInvisibleFields } from "components/CustomFields"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import Settings from "settings"
import LocationForm from "./Form"

const LocationNew = ({ pageDispatchers }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const location = new Location()
  // mutates the object
  initInvisibleFields(location, Settings.fields.location.customFields)
  return <LocationForm initialValues={location} title="Create a new Location" />
}

LocationNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(LocationNew)
