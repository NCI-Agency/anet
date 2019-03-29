import { SEARCH_OBJECT_TYPES } from "actions"
import API, { Settings } from "api"
import autobind from "autobind-decorator"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import Messages from "components/Messages"
import Page, {
  jumpToTop,
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import SavedSearchTable from "components/SavedSearchTable"
import searchFilters from "components/SearchFilters"
import { LAST_WEEK } from "dateUtils"
import GQL from "graphqlapi"
import { Person, Report } from "models"
import { superUserTour, userTour } from "pages/HopscotchTour"
import PropTypes from "prop-types"
import React from "react"
import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  Grid,
  Row
} from "react-bootstrap"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { deserializeQueryParams } from "searchUtils"

class BaseHome extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  constructor(props) {
    super(props)
    this.ALL_FILTERS = searchFilters.searchFilters()
    this.state = {
      success: null,
      error: null,
      tileCounts: [],
      savedSearches: [],
      selectedSearch: null
    }
  }

  adminQueries(currentUser) {
    return [
      this.allDraft(),
      this.allPending(),
      this.pendingMe(currentUser),
      this.allUpcoming(),
      this.mySensitiveInfo(),
      this.allApproved()
    ]
  }

  approverQueries(currentUser) {
    return [
      this.myDraft(currentUser),
      this.pendingMe(currentUser),
      this.myOrgRecent(currentUser),
      this.myOrgFuture(currentUser),
      this.mySensitiveInfo()
    ]
  }

  advisorQueries(currentUser) {
    return [
      this.myDraft(currentUser),
      this.myPending(currentUser),
      this.myOrgRecent(currentUser),
      this.myOrgFuture(currentUser),
      this.mySensitiveInfo()
    ]
  }

  allDraft() {
    return {
      title: "All draft reports",
      query: { state: [Report.STATE.DRAFT, Report.STATE.REJECTED] }
    }
  }

  myDraft(currentUser) {
    return {
      title: "My draft reports",
      query: {
        state: [Report.STATE.DRAFT, Report.STATE.REJECTED],
        authorUuid: currentUser.uuid
      }
    }
  }

  myPending(currentUser) {
    return {
      title: "My reports pending approval",
      query: {
        authorUuid: currentUser.uuid,
        state: [Report.STATE.PENDING_APPROVAL]
      }
    }
  }

  pendingMe(currentUser) {
    return {
      title: "Reports pending my approval",
      query: { pendingApprovalOf: currentUser.uuid }
    }
  }

  allPending() {
    return {
      title: "All reports pending approval",
      query: { state: [Report.STATE.PENDING_APPROVAL] }
    }
  }

  allApproved() {
    return {
      title: "All approved reports",
      query: {
        state: [Report.STATE.APPROVED],
        sortBy: "UPDATED_AT",
        sortOrder: "ASC"
      }
    }
  }

  myOrgRecent(currentUser) {
    if (!currentUser.position || !currentUser.position.organization) {
      return { query: {} }
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

  myOrgFuture(currentUser) {
    if (!currentUser.position || !currentUser.position.organization) {
      return { query: {} }
    }
    return {
      title:
        currentUser.position.organization.shortName + "'s upcoming engagements",
      query: {
        orgUuid: currentUser.position.organization.uuid,
        includeOrgChildren: false,
        state: [Report.STATE.FUTURE],
        sortOrder: "ASC"
      }
    }
  }

  allUpcoming() {
    return {
      title: "All upcoming engagements",
      query: { state: [Report.STATE.FUTURE], sortOrder: "ASC" }
    }
  }

  mySensitiveInfo() {
    return {
      title: "Reports with sensitive information",
      query: { state: [Report.STATE.PUBLISHED], sensitiveInfo: true }
    }
  }

  getQueriesForUser(currentUser) {
    if (currentUser.isAdmin()) {
      return this.adminQueries(currentUser)
    } else if (currentUser.position && currentUser.position.isApprover) {
      return this.approverQueries(currentUser)
    } else {
      return this.advisorQueries(currentUser)
    }
  }

  fetchData(props) {
    // If we don't have the currentUser yet (i.e. page is still loading, don't run these queries)
    const { currentUser } = props
    if (!currentUser || !currentUser._loaded) {
      return
    }
    // queries will contain the queries that will show up on the home tiles
    // Based on the users role. They are all report searches
    let queries = this.getQueriesForUser(currentUser)
    let queryParts = [] // GQL query parts
    queries.forEach((q, index) => {
      q.query.pageNum = 0
      q.query.pageSize = 1 // we're only interested in the totalCount, so just get at most one report
      queryParts.push(
        new GQL.Part(
          /* GraphQL */ `tile${index}: reportList(query:$query${index}) { totalCount}`
        ).addVariable("query" + index, "ReportSearchQueryInput", q.query)
      )
    })
    queryParts.push(
      new GQL.Part(/* GraphQL */ `
      savedSearches: mySearches {uuid, name, objectType, query}`)
    )
    GQL.run(queryParts).then(data => {
      let selectedSearch =
        data.savedSearches && data.savedSearches.length > 0
          ? data.savedSearches[0]
          : null
      this.setState({
        tileCounts: queries.map((q, index) => data["tile" + index].totalCount),
        savedSearches: data.savedSearches,
        selectedSearch: selectedSearch
      })
    })
  }

  render() {
    const { currentUser } = this.props
    const alertStyle = { top: 132, marginBottom: "1rem", textAlign: "center" }
    const supportEmail = Settings.SUPPORT_EMAIL_ADDR
    const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
    let queries = this.getQueriesForUser(currentUser)
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
            Your {Settings.fields.advisor.position.name} position has an
            inactive status.
            <br />
            Please contact your organization's super users to change your
            position to an active status.
            <br />
            If you are unsure, you can also contact the support team{" "}
            {supportEmailMessage}.
          </div>
        )}
        <Messages error={this.state.error} success={this.state.success} />

        <Fieldset className="home-tile-row" title="My ANET snapshot">
          <Grid fluid>
            <Row>
              {queries.map((query, index) => {
                return (
                  <Button
                    bsStyle="link"
                    onClick={this.onClickDashboard.bind(this, query)}
                    className="home-tile"
                    key={index}
                  >
                    <h1>{this.state.tileCounts[index]}</h1>
                    {query.title}
                  </Button>
                )
              })}
            </Row>
          </Grid>
        </Fieldset>

        <Fieldset title="Saved searches">
          <FormGroup controlId="savedSearchSelect">
            <ControlLabel>Select a saved search</ControlLabel>
            <FormControl
              componentClass="select"
              onChange={this.onSaveSearchSelect}
            >
              {this.state.savedSearches &&
                this.state.savedSearches.map(savedSearch => (
                  <option value={savedSearch.uuid} key={savedSearch.uuid}>
                    {savedSearch.name}
                  </option>
                ))}
            </FormControl>
          </FormGroup>

          {this.state.selectedSearch && (
            <div>
              <div className="pull-right">
                <Button style={{ marginRight: 12 }} onClick={this.showSearch}>
                  Show Search
                </Button>
                <ConfirmDelete
                  onConfirmDelete={this.onConfirmDelete}
                  objectType="search"
                  objectDisplay={this.state.selectedSearch.name}
                  bsStyle="danger"
                  buttonLabel="Delete Search"
                />
              </div>
              <SavedSearchTable search={this.state.selectedSearch} />
            </div>
          )}
        </Fieldset>
      </div>
    )
  }

  @autobind
  onClickDashboard(queryDetails, event) {
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.REPORTS,
      queryDetails.query,
      this.deserializeCallback
    )
    event.preventDefault()
    event.stopPropagation()
  }

  @autobind
  onSaveSearchSelect(event) {
    let uuid = event && event.target ? event.target.value : event
    let search = this.state.savedSearches.find(el => el.uuid === uuid)
    this.setState({ selectedSearch: search })
  }

  @autobind
  showSearch() {
    let search = this.state.selectedSearch
    if (search) {
      const objType = SEARCH_OBJECT_TYPES[search.objectType]
      const queryParams = JSON.parse(search.query)
      deserializeQueryParams(objType, queryParams, this.deserializeCallback)
    }
  }

  @autobind
  deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    this.props.setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
    this.props.history.push({
      pathname: "/search"
    })
  }

  @autobind
  onConfirmDelete() {
    const search = this.state.selectedSearch
    const index = this.state.savedSearches.findIndex(
      s => s.uuid === search.uuid
    )
    const operation = "deleteSavedSearch"
    let graphql = operation + "(uuid: $uuid)"
    const variables = { uuid: search.uuid }
    const variableDef = "($uuid: String!)"
    API.mutation(graphql, variables, variableDef)
      .then(data => {
        let savedSearches = this.state.savedSearches
        savedSearches.splice(index, 1)
        let nextSelect = savedSearches.length > 0 ? savedSearches[0] : null
        this.setState({
          savedSearches: savedSearches,
          selectedSearch: nextSelect
        })
      })
      .catch(error => {
        this.setState({ success: null, error: error })
        jumpToTop()
      })
  }
}

const Home = props => (
  <AppContext.Consumer>
    {context => <BaseHome currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(withRouter(Home))
