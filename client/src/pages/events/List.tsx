import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  setPagination
} from "actions"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import EventSearchResults from "components/search/EventSearchResults"
import EventSeriesSearchResults from "components/search/EventSeriesSearchResults"
import React from "react"
import { connect } from "react-redux"

const queryParams = {
  pageSize: 10,
  status: "ACTIVE"
}

interface EventListProps {
  pageDispatchers?: PageDispatchersPropType
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

const EventsList = ({
  pageDispatchers,
  pagination,
  setPagination
}: EventListProps) => {
  const { done, result } = useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Events")

  if (done) {
    return result
  }

  return (
    <>
      <Fieldset title="Event Series" id="event-series">
        <EventSeriesSearchResults
          queryParams={queryParams}
          pageDispatchers={pageDispatchers}
          paginationKey="eventSeries"
          pagination={pagination}
          setPagination={setPagination}
        />
      </Fieldset>

      <Fieldset title="Events" id="events">
        <EventSearchResults
          queryParams={queryParams}
          pageDispatchers={pageDispatchers}
          paginationKey="events"
          pagination={pagination}
          setPagination={setPagination}
        />
      </Fieldset>
    </>
  )
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setPagination: (pageKey, pageNum) =>
      dispatch(setPagination(pageKey, pageNum)),
    ...pageDispatchers
  }
}

const mapStateToProps = state => ({
  pagination: state.pagination
})

export default connect(mapStateToProps, mapDispatchToProps)(EventsList)
