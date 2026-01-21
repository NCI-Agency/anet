import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import EventCollection from "components/EventCollection"
import EventSeriesTable from "components/EventSeriesTable"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { getSearchQuery, SearchQueryPropType } from "components/SearchFilters"
import React, { useContext, useMemo } from "react"
import { connect } from "react-redux"

interface MyEventsProps {
  pageDispatchers?: PageDispatchersPropType
  searchQuery?: SearchQueryPropType
}

const MyEvents = ({ pageDispatchers, searchQuery }: MyEventsProps) => {
  // Make sure we have a navigation menu
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })
  usePageTitle("My Events")
  const { currentUser } = useContext(AppContext)

  // Memorize the search query parameters we use to prevent unnecessary re-renders
  const searchQueryParams = useMemo(
    () => getSearchQuery(searchQuery),
    [searchQuery]
  )
  const eventSearchQueryParams = useMemo(
    () => ({
      ...searchQueryParams,
      adminOrgUuid: currentUser.position.organizationsAdministrated.map(
        org => org.uuid
      )
    }),
    [currentUser, searchQueryParams]
  )

  return (
    <div>
      {renderEventSeriesSection()}
      {renderEventsSection()}
    </div>
  )

  function renderEventSeriesSection() {
    return (
      <Fieldset title="Event Series" id="my-event-series">
        <EventSeriesTable queryParams={eventSearchQueryParams} />
      </Fieldset>
    )
  }

  function renderEventsSection() {
    return (
      <Fieldset title="Events" id="my-events">
        <EventCollection
          queryParams={eventSearchQueryParams}
          mapId="event"
          showEventSeries
        />
      </Fieldset>
    )
  }
}

const mapStateToProps = state => ({
  searchQuery: state.searchQuery
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(MyEvents)
