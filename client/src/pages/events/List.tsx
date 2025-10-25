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
import React, { useState } from "react"
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

  const [pagination, setPagination] = useState({
    eventSeries: { pageNum: 0 },
    events: { pageNum: 0 }
  })

  if (done) return result

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
          paginationKey="eventSeries"
          pagination={pagination}
          setPagination={(key, pageNum) =>
            setPagination(prev => ({
              ...prev,
              [key]: { pageNum }
            }))
          }
        />
      </Fieldset>

      <Fieldset title="Events">
        <EventSearchResults
          queryParams={queryParams}
          pageDispatchers={pageDispatchers}
          paginationKey="events"
          pagination={pagination}
          setPagination={(key, pageNum) =>
            setPagination(prev => ({
              ...prev,
              [key]: { pageNum }
            }))
          }
        />
      </Fieldset>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventsList)
