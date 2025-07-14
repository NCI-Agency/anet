import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import {
  clearSearchQuery,
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API from "api"
import AppContext from "components/AppContext"
import DraggableRow from "components/DraggableRow"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import Messages from "components/Messages"
import MySubscriptionUpdates from "components/MySubscriptionUpdates"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import {
  deserializeQueryParams,
  SearchDescription
} from "components/SearchFilters"
import { LAST_WEEK } from "dateUtils"
import { Report } from "models"
import { superuserTour, userTour } from "pages/GuidedTour"
import SearchResults from "pages/searches/SearchResults"
import React, { useContext, useEffect, useState } from "react"
import { Badge, Button, Col, Container, Row } from "react-bootstrap"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { connect } from "react-redux"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"

const GQL_GET_REPORT_COUNT = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
    }
  }
`
const GQL_GET_USERS_PENDING_VERIFICATION = gql`
  query ($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      totalCount
    }
  }
`

const GQL_GET_HOMEPAGE_SAVED_SEARCHES = gql`
  query {
    savedSearches: mySearches(forHomepage: true) {
      uuid
      name
      objectType
      query
      displayInHomepage
      priority
      homepagePriority
    }
  }
`

const GQL_UPDATE_SAVED_SEARCH = gql`
  mutation ($savedSearch: SavedSearchInput!) {
    updateSavedSearch(savedSearch: $savedSearch)
  }
`

interface HomeTileProps {
  pageDispatchers?: PageDispatchersPropType
  query: any
  setSearchQuery: (...args: unknown[]) => unknown
}

const HomeTile = ({
  query,
  setSearchQuery,
  pageDispatchers
}: HomeTileProps) => {
  const navigate = useNavigate()
  const reportQuery = Object.assign({}, query.query, {
    // we're only interested in the totalCount, so just get at most one report
    pageSize: 1
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_COUNT, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const totalCount = data && data.reportList && data.reportList.totalCount
  return (
    <Button
      variant="link"
      onClick={event => onClickDashboard(query, event)}
      className="home-tile"
    >
      {(done && result) || <h1>{totalCount}</h1>}
      {query.title}
    </Button>
  )

  function onClickDashboard(queryDetails, event) {
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.REPORTS,
      queryDetails.query,
      deserializeCallback
    )
    event.preventDefault()
    event.stopPropagation()
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType,
      filters,
      text
    })
    navigate("/search")
  }
}

interface HomeTilesProps {
  pageDispatchers?: PageDispatchersPropType
  setSearchQuery: (...args: unknown[]) => unknown
  currentUser?: any
}

const HomeTiles = ({
  currentUser,
  setSearchQuery,
  pageDispatchers
}: HomeTilesProps) => {
  // queries will contain the queries that will show up on the home tiles
  // Based on the users role. They are all report searches
  const queries = getQueriesForUser(currentUser)

  return (
    <Container fluid>
      <Row>
        {queries
          .filter(q => q.query !== null)
          .map((query, index) => (
            <Col
              key={index}
              className="home-tile-col d-flex align-items-stretch p-0"
            >
              <HomeTile
                query={query}
                setSearchQuery={setSearchQuery}
                pageDispatchers={pageDispatchers}
              />
            </Col>
          ))}
      </Row>
    </Container>
  )

  function getQueriesForUser(currentUser) {
    if (currentUser.isAdmin()) {
      return adminQueries(currentUser)
    } else if (currentUser.position && currentUser.position.isApprover) {
      return approverQueries(currentUser)
    } else {
      return regularUserQueries(currentUser)
    }
  }

  function adminQueries(currentUser) {
    return [
      myDraft(currentUser),
      allPending(),
      pendingMe(currentUser),
      allPlanned(),
      mySensitiveInfo(),
      allApproved()
    ]
  }

  function approverQueries(currentUser) {
    return [
      myDraft(currentUser),
      pendingMe(currentUser),
      myOrgRecent(currentUser),
      myOrgFuture(currentUser),
      mySensitiveInfo()
    ]
  }

  function regularUserQueries(currentUser) {
    return [
      myDraft(currentUser),
      myPending(currentUser),
      myOrgRecent(currentUser),
      myOrgFuture(currentUser),
      mySensitiveInfo()
    ]
  }

  function myDraft(currentUser) {
    return {
      title: "My draft reports",
      query: {
        state: [Report.STATE.DRAFT, Report.STATE.REJECTED],
        authorUuid: currentUser.uuid
      }
    }
  }

  function myPending(currentUser) {
    return {
      title: "My reports pending approval",
      query: {
        authorUuid: currentUser.uuid,
        state: [Report.STATE.PENDING_APPROVAL]
      }
    }
  }

  function pendingMe(currentUser) {
    return {
      title: "Reports pending my approval",
      query: { pendingApprovalOf: currentUser.uuid }
    }
  }

  function allPending() {
    return {
      title: "All reports pending approval",
      query: { state: [Report.STATE.PENDING_APPROVAL] }
    }
  }

  function allApproved() {
    return {
      title: "All approved reports",
      query: {
        state: [Report.STATE.APPROVED],
        sortBy: "UPDATED_AT",
        sortOrder: "ASC"
      }
    }
  }

  function myOrgRecent(currentUser) {
    if (!currentUser.position || !currentUser.position.organization) {
      return { query: null }
    }
    return {
      title:
        currentUser.position.organization.shortName +
        "'s reports in the last 7 days",
      query: {
        orgUuid: currentUser.position.organization.uuid,
        orgRecurseStrategy: RECURSE_STRATEGY.NONE,
        createdAtStart: LAST_WEEK,
        state: [
          Report.STATE.APPROVED,
          Report.STATE.PUBLISHED,
          Report.STATE.CANCELLED,
          Report.STATE.PENDING_APPROVAL
        ]
      }
    }
  }

  function myOrgFuture(currentUser) {
    if (!currentUser.position || !currentUser.position.organization) {
      return { query: null }
    }
    return {
      title:
        currentUser.position.organization.shortName + "'s planned engagements",
      query: {
        orgUuid: currentUser.position.organization.uuid,
        orgRecurseStrategy: RECURSE_STRATEGY.NONE,
        state: [Report.STATE.APPROVED, Report.STATE.PUBLISHED],
        engagementStatus: Report.ENGAGEMENT_STATUS.FUTURE,
        sortOrder: "ASC"
      }
    }
  }

  function allPlanned() {
    return {
      title: "All planned engagements",
      query: {
        state: [Report.STATE.APPROVED, Report.STATE.PUBLISHED],
        engagementStatus: Report.ENGAGEMENT_STATUS.FUTURE,
        sortOrder: "ASC"
      }
    }
  }

  function mySensitiveInfo() {
    return {
      title: "Reports with sensitive information",
      query: {
        state: [Report.STATE.APPROVED, Report.STATE.PUBLISHED],
        sensitiveInfo: true
      }
    }
  }
}

interface UsersPendingVerificationProps {
  pageDispatchers?: PageDispatchersPropType
  clearSearchQuery: (...args: unknown[]) => unknown
}

const UsersPendingVerification = ({
  pageDispatchers,
  clearSearchQuery
}: UsersPendingVerificationProps) => {
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_USERS_PENDING_VERIFICATION,
    {
      personQuery: { pageSize: 1, pendingVerification: true }
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const { totalCount } = data.personList
  return (
    <Fieldset title="Users Pending Verification">
      {totalCount <= 0 ? (
        <em>No users pending verification</em>
      ) : (
        <Link to="/admin/usersPendingVerification" onClick={clearSearchQuery}>
          {totalCount} user(s) pending verification
        </Link>
      )}
    </Fieldset>
  )
}

interface HiddenSearchResultsCountersProps {
  searches: any[]
  pageDispatchers: PageDispatchersPropType
  setSearchCount: (...args: unknown[]) => unknown
}

const HiddenSearchResultsCounters = React.memo(
  function HiddenSearchResultsCounters({
    searches,
    pageDispatchers,
    setSearchCount
  }: HiddenSearchResultsCountersProps) {
    return (
      <div style={{ display: "none" }}>
        {searches.map(search => (
          <SearchResults
            key={search.uuid}
            pageDispatchers={pageDispatchers}
            searchQuery={search.query}
            objectType={search.objectType}
            setSearchCount={count =>
              setSearchCount(prev => ({
                ...prev,
                [search.uuid]: count
              }))}
            pageSize={1}
          />
        ))}
      </div>
    )
  }
)

interface MySavedSearchesProps {
  pageDispatchers?: PageDispatchersPropType
  setSearchQuery: (...args: unknown[]) => unknown
}

const MySavedSearches = ({
  pageDispatchers,
  setSearchQuery
}: MySavedSearchesProps) => {
  const navigate = useNavigate()
  const [savedQueries, setSavedQueries] = useState({})
  const [searchCount, setSearchCount] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [searches, setSearches] = useState([])

  const { data, loading, error } = API.useApiQuery(
    GQL_GET_HOMEPAGE_SAVED_SEARCHES
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  useEffect(() => {
    if (data?.savedSearches) {
      Promise.all(
        data.savedSearches.map(
          search =>
            new Promise(resolve => {
              const objType = SEARCH_OBJECT_TYPES[search.objectType]
              const queryParams = utils.parseJsonSafe(search.query)
              deserializeQueryParams(
                objType,
                queryParams,
                (objectType, filters, text) => {
                  resolve({
                    uuid: search.uuid,
                    value: { objectType, filters, text }
                  })
                }
              )
            })
        )
      ).then(results => {
        const newSavedQueries = {}
        results.forEach(({ uuid, value }) => {
          newSavedQueries[uuid] = value
        })
        setSavedQueries(newSavedQueries)
        setSearches(data.savedSearches)
        setCollapsed(
          results.reduce((acc, { uuid }) => ({ ...acc, [uuid]: true }), {})
        )
        setSearchCount(
          results.reduce((acc, { uuid }) => ({ ...acc, [uuid]: 0 }), {})
        )
      })
    }
  }, [data, setSavedQueries, setSearches, setCollapsed, setSearchCount])

  if (done) {
    return result
  }
  if (!searches.length) {
    return null
  }

  const moveRow = (from, to) => {
    setSearches(prevSearches => {
      const updated = [...prevSearches]
      const [removed] = updated.splice(from, 1)
      updated.splice(to, 0, removed)

      let newHomepagePriority
      if (to === 0) {
        newHomepagePriority = updated[0].homepagePriority - 1
      } else if (to === updated.length - 1) {
        newHomepagePriority = updated[updated.length - 1].homepagePriority + 1.0
      } else {
        const above = updated[to - 1].homepagePriority
        const below = updated[to + 1].homepagePriority
        newHomepagePriority = (above + below) / 2
      }

      updated[to].homepagePriority = newHomepagePriority
      return updated
    })
  }

  const onDropRow = (uuid, toIndex) => {
    const search = searches.find(s => s.uuid === uuid)
    if (!search) {
      return
    }
    API.mutation(GQL_UPDATE_SAVED_SEARCH, {
      savedSearch: search
    })
  }

  const showSearch = uuid => {
    setSearchQuery(savedQueries[uuid])
    navigate("/search")
  }

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        {searches.map((search, i) => (
          <Fieldset
            className="saved-search-row mb-4"
            title={i === 0 ? "My Saved Searches" : null}
            key={search.uuid}
          >
            <DraggableRow
              itemType="SAVED_SEARCH_ROW"
              row={search}
              index={i}
              moveRow={moveRow}
              onDropRow={onDropRow}
              dragHandleProps={{}}
            >
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center">
                  <Button
                    className="d-flex align-items-center w-100 text-start text-decoration-none p-0"
                    variant="link"
                    onClick={() =>
                      setCollapsed(prev => ({
                        ...prev,
                        [search.uuid]: !prev[search.uuid]
                      }))}
                  >
                    <span className="flex-grow-1">
                      <SearchDescription
                        searchQuery={savedQueries[search.uuid]}
                        showText
                        style={{ fontSize: 20, pointerEvents: "none" }}
                      />
                      <Badge bg="primary" className="fs-6 px-2 py-1 ms-2">
                        {searchCount[search.uuid]}
                      </Badge>
                    </span>
                    <span className="ms-2">
                      <Icon
                        className="align-middle"
                        icon={
                          collapsed[search.uuid]
                            ? IconNames.CHEVRON_DOWN
                            : IconNames.CHEVRON_UP
                        }
                        size={20}
                        style={{ fontSize: 22, color: "initial" }}
                      />
                    </span>
                  </Button>
                </div>
                {!collapsed[search.uuid] && (
                  <>
                    <SearchResults
                      pageDispatchers={pageDispatchers}
                      searchQuery={search.query}
                      objectType={search.objectType}
                      setSearchCount={() => {}}
                    />
                    <Button
                      className="text-start p-0"
                      variant="link"
                      onClick={() => showSearch(search.uuid)}
                    >
                      Show full search results
                    </Button>
                  </>
                )}
              </div>
            </DraggableRow>
          </Fieldset>
        ))}
      </DndProvider>
      <HiddenSearchResultsCounters
        searches={data.savedSearches}
        pageDispatchers={pageDispatchers}
        setSearchCount={setSearchCount}
      />
    </>
  )
}

interface HomeProps {
  setSearchQuery: (...args: unknown[]) => unknown
  pageDispatchers?: PageDispatchersPropType
  clearSearchQuery(...args: unknown[]): unknown
}

const Home = ({
  pageDispatchers,
  setSearchQuery,
  clearSearchQuery
}: HomeProps) => {
  const { currentUser } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const alertStyle = { marginBottom: "1rem", textAlign: "center", zIndex: "-1" }
  const supportEmail = Settings.SUPPORT_EMAIL_ADDR
  const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Home")
  return (
    <div>
      <div style={{ width: "inherit" }} className="float-end">
        <GuidedTour
          title="Take a guided tour of the home page."
          tour={currentUser.isSuperuser() ? superuserTour : userTour}
          autostart={
            localStorage.newUser === "true" &&
            localStorage.hasSeenHomeTour !== "true"
          }
          onEnd={() => (localStorage.hasSeenHomeTour = "true")}
        />
      </div>

      {!currentUser.hasAssignedPosition() && (
        <div className="alert alert-warning" style={alertStyle}>
          You are not assigned to a position.
          <br />
          Please contact your organization's superuser(s) to assign you to a
          position.
          <br />
          If you are unsure, you can also contact the support team{" "}
          {supportEmailMessage}.
        </div>
      )}
      {currentUser.hasAssignedPosition() &&
        !currentUser.hasActivePosition() && (
          <div className="alert alert-warning" style={alertStyle}>
            Your position has an inactive status.
            <br />
            Please contact your organization's superusers to change your
            position to an active status.
            <br />
            If you are unsure, you can also contact the support team{" "}
            {supportEmailMessage}.
          </div>
      )}

      <Messages success={stateSuccess} />

      <Fieldset className="home-tile-row" title="My ANET snapshot">
        <HomeTiles
          currentUser={currentUser}
          setSearchQuery={setSearchQuery}
          pageDispatchers={pageDispatchers}
        />
      </Fieldset>

      {!Settings.automaticallyAllowAllNewUsers && currentUser?.isAdmin() && (
        <UsersPendingVerification
          pageDispatchers={pageDispatchers}
          clearSearchQuery={clearSearchQuery}
        />
      )}

      <MySubscriptionUpdates />

      <MySavedSearches
        pageDispatchers={pageDispatchers}
        setSearchQuery={setSearchQuery}
      />
    </div>
  )
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    clearSearchQuery: () => dispatch(clearSearchQuery()),
    ...pageDispatchers
  }
}

export default connect(null, mapDispatchToProps)(Home)
