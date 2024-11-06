import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import { initInvisibleFields } from "components/CustomFields"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import Settings from "settings"
import LocationForm from "./Form"

interface LocationNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const LocationNew = ({ pageDispatchers }: LocationNewProps) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Location")

  const location = new Location()
  // mutates the object
  initInvisibleFields(location, Settings.fields.location.customFields)
  return <LocationForm initialValues={location} title="Create a new Location" />
}

export default connect(null, mapPageDispatchersToProps)(LocationNew)
