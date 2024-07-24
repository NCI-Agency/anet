import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Event, EventSeries } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import EventForm from "./Form"

const EventNew = ({ pageDispatchers }) => {
  const routerLocation = useLocation()
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Event")

  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.get("eventSeriesUuid")) {
    return (
      <EventNewFetchEventSeries
        eventSeriesUuid={qs.get("eventSeriesUuid")}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <EventNewConditional pageDispatchers={pageDispatchers} />
}

const EventNewFetchEventSeries = ({ eventSeriesUuid, pageDispatchers }) => {
  const queryResult = API.useApiQuery(EventSeries.getEventSeriesQueryMin, {
    uuid: eventSeriesUuid
  })
  return (
    <EventNewConditional
      pageDispatchers={pageDispatchers}
      {...queryResult}
      eventSeriesUuid={eventSeriesUuid}
    />
  )
}

EventNewFetchEventSeries.propTypes = {
  eventSeriesUuid: PropTypes.string.isRequired,
  pageDispatchers: PageDispatchersPropType
}

const EventNewConditional = ({
  loading,
  error,
  data,
  eventSeriesUuid,
  pageDispatchers
}) => {
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "EventSeries",
    uuid: eventSeriesUuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const event = new Event()
  if (data) {
    event.eventSeries = new EventSeries(data.eventSeries)
    event.hostOrg = data.eventSeries.hostOrg
    event.adminOrg = data.eventSeries.adminOrg
  }
  // mutates the object
  initInvisibleFields(event, Settings.fields.organization.customFields)
  return <EventForm initialValues={event} title="Create a new Event" />
}

EventNewConditional.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  data: PropTypes.object,
  eventSeriesUuid: PropTypes.string,
  pageDispatchers: PageDispatchersPropType
}
EventNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(EventNew)
