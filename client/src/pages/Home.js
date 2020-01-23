import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import Messages from "components/Messages"
import {
  PageDispatchersPropType,
  jumpToTop,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import SavedSearchTable from "components/SavedSearchTable"
import { LAST_WEEK } from "dateUtils"
import _isEmpty from "lodash/isEmpty"
import { Person, Report } from "models"
import { superUserTour, userTour } from "pages/HopscotchTour"
import PropTypes from "prop-types"
import React, { useState } from "react"
import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  Grid,
  Row
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory, useLocation } from "react-router-dom"
import { deserializeQueryParams } from "searchUtils"

const GQL_GET_SAVED_SEARCHES = gql`
  query {
    savedSearches: mySearches {
      uuid
      name
      objectType
      query
    }
  }
`

const GQL_DELETE_SAVED_SEARCH = gql`
  mutation($uuid: String!) {
    deleteSavedSearch(uuid: $uuid)
  }
`

const GQL_GET_REPORT_COUNT = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
    }
  }
`

const HomeTile = ({ query, setSearchQuery, pageDispatchers }) => {
  const history = useHistory()
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
      bsStyle="link"
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
      objectType: objectType,
      filters: filters,
      text: text
    })
    history.push("/search")
  }
}

HomeTile.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  query: PropTypes.object.isRequired,
  setSearchQuery: PropTypes.func.isRequired
}

const HomeTiles = ({ currentUser, setSearchQuery, pageDispatchers }) => {
  // queries will contain the queries that will show up on the home tiles
  // Based on the users role. They are all report searches
  const queries = getQueriesForUser(currentUser)

  return (
    <Grid fluid>
      <Row>
        {queries
          .filter(q => q.query !== null)
          .map((query, index) => (
            <HomeTile
              key={index}
              query={query}
              setSearchQuery={setSearchQuery}
              pageDispatchers={pageDispatchers}
            />
          ))}
      </Row>
    </Grid>
  )

  function getQueriesForUser(currentUser) {
    if (currentUser.isAdmin()) {
      return adminQueries(currentUser)
    } else if (currentUser.position && currentUser.position.isApprover) {
      return approverQueries(currentUser)
    } else {
      return advisorQueries(currentUser)
    }
  }

  function adminQueries(currentUser) {
    return [
      allDraft(),
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

  function advisorQueries(currentUser) {
    return [
      myDraft(currentUser),
      myPending(currentUser),
      myOrgRecent(currentUser),
      myOrgFuture(currentUser),
      mySensitiveInfo()
    ]
  }

  function allDraft() {
    return {
      title: "All draft reports",
      query: { state: [Report.STATE.DRAFT, Report.STATE.REJECTED] }
    }
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
        includeOrgChildren: false,
        createdAtStart: LAST_WEEK,
        state: [
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
        includeOrgChildren: false,
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
      query: { state: [Report.STATE.PUBLISHED], sensitiveInfo: true }
    }
  }
}

HomeTiles.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  setSearchQuery: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(Person)
}

const SavedSearches = ({ setSearchQuery, pageDispatchers }) => {
  const history = useHistory()
  const [stateError, setStateError] = useState(null)
  const [selectedSearch, setSelectedSearch] = useState(null)
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_SAVED_SEARCHES
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  let savedSearches = []
  if (data) {
    savedSearches = data.savedSearches
    if (_isEmpty(savedSearches)) {
      if (selectedSearch) {
        // Clear selection
        setSelectedSearch(null)
      }
    } else if (!savedSearches.includes(selectedSearch)) {
      // Select first one
      setSelectedSearch(savedSearches[0])
    }
  }

  return (
    <>
      <Messages error={stateError} />
      <FormGroup controlId="savedSearchSelect">
        <ControlLabel>Select a saved search</ControlLabel>
        <FormControl componentClass="select" onChange={onSaveSearchSelect}>
          {savedSearches &&
            savedSearches.map(savedSearch => (
              <option value={savedSearch.uuid} key={savedSearch.uuid}>
                {savedSearch.name}
              </option>
            ))}
        </FormControl>
      </FormGroup>

      {selectedSearch && (
        <div>
          <div className="pull-right">
            <Button style={{ marginRight: 12 }} onClick={showSearch}>
              Show Search
            </Button>
            <ConfirmDelete
              onConfirmDelete={onConfirmDelete}
              objectType="search"
              objectDisplay={selectedSearch.name}
              bsStyle="danger"
              buttonLabel="Delete Search"
            />
          </div>
          <SavedSearchTable search={selectedSearch} />
        </div>
      )}
    </>
  )

  function onSaveSearchSelect(event) {
    const uuid = event && event.target ? event.target.value : event
    const search = savedSearches.find(el => el.uuid === uuid)
    setSelectedSearch(search)
  }

  function showSearch() {
    if (selectedSearch) {
      const objType = SEARCH_OBJECT_TYPES[selectedSearch.objectType]
      const queryParams = JSON.parse(selectedSearch.query)
      deserializeQueryParams(objType, queryParams, deserializeCallback)
    }
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
    history.push("/search")
  }

  function onConfirmDelete() {
    return API.mutation(GQL_DELETE_SAVED_SEARCH, { uuid: selectedSearch.uuid })
      .then(data => {
        refetch()
      })
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

SavedSearches.propTypes = {
  setSearchQuery: PropTypes.func.isRequired,
  pageDispatchers: PageDispatchersPropType
}

const BaseHome = ({ currentUser, setSearchQuery, pageDispatchers }) => {
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const alertStyle = { top: 132, marginBottom: "1rem", textAlign: "center" }
  const supportEmail = Settings.SUPPORT_EMAIL_ADDR
  const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return (
    <div>
      <div className="pull-right">
        <GuidedTour
          title="Take a guided tour of the home page."
          tour={currentUser.isSuperUser() ? superUserTour : userTour}
          autostart={
            localStorage.newUser === "true" &&
            localStorage.hasSeenHomeTour !== "true"
          }
          onEnd={() => (localStorage.hasSeenHomeTour = "true")}
        />
      </div>

      {!currentUser.hasAssignedPosition() && (
        <div className="alert alert-warning" style={alertStyle}>
          You are not assigned to a {Settings.fields.advisor.position.name}{" "}
          position.
          <br />
          Please contact your organization's super user(s) to assign you to a{" "}
          {Settings.fields.advisor.position.name} position.
          <br />
          If you are unsure, you can also contact the support team{" "}
          {supportEmailMessage}.
        </div>
      )}
      {currentUser.hasAssignedPosition() && !currentUser.hasActivePosition() && (
        <div className="alert alert-warning" style={alertStyle}>
          Your {Settings.fields.advisor.position.name} position has an inactive
          status.
          <br />
          Please contact your organization's super users to change your position
          to an active status.
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

      <Fieldset title="Saved searches">
        <SavedSearches
          setSearchQuery={setSearchQuery}
          pageDispatchers={pageDispatchers}
        />
      </Fieldset>
    </div>
  )
}

BaseHome.propTypes = {
  setSearchQuery: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(Person),
  pageDispatchers: PageDispatchersPropType
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

const Home = props => (
  <AppContext.Consumer>
    {context => <BaseHome currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(Home)
