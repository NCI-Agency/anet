import { gql } from "@apollo/client"
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
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import EventForm from "./Form"

const GQL_GET_EVENTSERIES = gql`
  query ($uuid: String) {
    eventSeries(uuid: $uuid) {
      ${EventSeries.autocompleteQuery}
    }
  }
`

interface EventNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventNew = ({ pageDispatchers }: EventNewProps) => {
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

interface EventNewFetchEventSeriesProps {
  eventSeriesUuid: string
  pageDispatchers?: PageDispatchersPropType
}

const EventNewFetchEventSeries = ({
  eventSeriesUuid,
  pageDispatchers
}: EventNewFetchEventSeriesProps) => {
  const queryResult = API.useApiQuery(GQL_GET_EVENTSERIES, {
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

interface EventNewConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  eventSeriesUuid?: string
  pageDispatchers?: PageDispatchersPropType
}

const EventNewConditional = ({
  loading,
  error,
  data,
  eventSeriesUuid,
  pageDispatchers
}: EventNewConditionalProps) => {
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
    event.ownerOrg = data.eventSeries.ownerOrg
    event.hostOrg = data.eventSeries.hostOrg
    event.adminOrg = data.eventSeries.adminOrg
  }
  // mutates the object
  initInvisibleFields(event, Settings.fields.organization.customFields)
  return (
    <EventForm
      pageDispatchers={pageDispatchers}
      initialValues={event}
      title="Create a new Event"
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(EventNew)
