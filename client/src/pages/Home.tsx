import { gql } from "@apollo/client"
import {
  clearSearchQuery,
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API from "api"
import AppContext from "components/AppContext"
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
import { deserializeQueryParams } from "components/SearchFilters"
import { LAST_WEEK } from "dateUtils"
import { Report } from "models"
import { superuserTour, userTour } from "pages/GuidedTour"
import React, { useContext } from "react"
import { Button, Col, Container, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"

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
