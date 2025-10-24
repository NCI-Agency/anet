import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import EventSearchResults from "components/search/EventSearchResults"
import EventSeriesSearchResults from "components/search/EventSeriesSearchResults"
import { EventSeries } from "models"
import React from "react"
import { connect } from "react-redux"

interface EventListPros {
  pageDispatchers?: PageDispatchersPropType
}

const EventsList = ({ pageDispatchers }: EventListPros) => {
  const { done, result } = useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Events")

  if (done) {
    return result
  }

  const queryParams = {
    pageSize: 10,
    sortBy: "NAME",
    sortOrder: "ASC",
    status: "ACTIVE"
  }

  return (
    <>
      <Fieldset title="Event Series">
        <EventSeriesSearchResults
          queryParams={queryParams}
          pageDispatchers={pageDispatchers}
        />
      </Fieldset>

      <Fieldset title="Events">
        <EventSearchResults
          queryParams={queryParams}
          pageDispatchers={pageDispatchers}
        />
      </Fieldset>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventsList)
