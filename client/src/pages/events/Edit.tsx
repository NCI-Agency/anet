import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Event } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import EventForm from "./Form"

interface EventEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventEdit = ({ pageDispatchers }: EventEditProps) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(
    Event.getEventQueryNoIsSubscribed,
    {
      uuid
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Event",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.event?.name && `Edit | ${data.event.name}`)
  if (done) {
    return result
  }

  const event = new Event(data ? data.event : {})
  return (
    <div>
      <EventForm edit initialValues={event} title={`Event ${event.name}`} />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventEdit)
