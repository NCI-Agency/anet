import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import EventCollection from "components/EventCollection"
import EventSeriesCollection from "components/EventSeriesCollection"
import Fieldset from "components/Fieldset"
import { AnchorNavItem } from "components/Nav"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { getSearchQuery, SearchQueryPropType } from "components/SearchFilters"
import SubNav from "components/SubNav"
import React, { useContext, useMemo } from "react"
import { Nav } from "react-bootstrap"
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
    () =>
      Object.assign({}, searchQueryParams, {
        sortBy: "NAME",
        sortOrder: "ASC",
        adminOrgUuid: currentUser.position.organizationsAdministrated.map(
          org => org.uuid
        )
      }),
    [currentUser, searchQueryParams]
  )

  return (
    <div>
      <SubNav subnavElemId="events-nav">
        <span id="style-nav">
          <Nav className="flex-column">
            <Nav.Item>
              <AnchorNavItem to="eventSeries">Event Series</AnchorNavItem>
            </Nav.Item>
            <Nav.Item>
              <AnchorNavItem to="events">Events</AnchorNavItem>
            </Nav.Item>
          </Nav>
        </span>
      </SubNav>

      {renderEventSeriesSection()}
      {renderEventsSection()}
    </div>
  )

  function renderEventSeriesSection() {
    return (
      <Fieldset title="Event Series" id="my-event-series">
        <EventSeriesCollection
          paginationKey={`e_eventSeries_${currentUser.uuid}`}
          queryParams={eventSearchQueryParams}
          mapId="eventSeries"
        />
      </Fieldset>
    )
  }

  function renderEventsSection() {
    return (
      <Fieldset title="Events" id="my-events">
        <EventCollection
          paginationKey={`e_event_${currentUser.uuid}`}
          queryParams={eventSearchQueryParams}
          mapId="event"
          showEventSeries
        />
      </Fieldset>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(MyEvents)
