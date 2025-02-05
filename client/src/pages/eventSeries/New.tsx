import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import { initInvisibleFields } from "components/CustomFields"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { EventSeries } from "models"
import React from "react"
import { connect } from "react-redux"
import Settings from "settings"
import EventSeriesForm from "./Form"

interface EventSeriesNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventSeriesNew = ({ pageDispatchers }: EventSeriesNewProps) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Event Series")

  const eventSeries = new EventSeries()
  // mutates the object
  initInvisibleFields(location, Settings.fields.location.customFields)
  return (
    <EventSeriesForm
      initialValues={eventSeries}
      title="Create a new Event Series"
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(EventSeriesNew)
