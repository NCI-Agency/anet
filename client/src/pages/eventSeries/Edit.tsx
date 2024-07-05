import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { EventSeries } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import EventSeriesForm from "./Form"

interface EventSeriesEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventSeriesEdit = ({ pageDispatchers }: EventSeriesEditProps) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(
    EventSeries.getEventSeriesQuery,
    {
      uuid
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "EventSeries",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.eventSeries?.name && `Edit | ${data.eventSeries.name}`)
  if (done) {
    return result
  }

  const eventSeries = new EventSeries(data ? data.eventSeries : {})
  return (
    <div>
      <EventSeriesForm
        edit
        initialValues={eventSeries}
        title={`Event Series ${eventSeries.name}`}
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventSeriesEdit)
