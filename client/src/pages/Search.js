import { SEARCH_OBJECT_LABELS, SEARCH_OBJECT_TYPES } from "actions"
import API, { Settings } from "api"
import autobind from "autobind-decorator"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { AnchorNavItem } from "components/Nav"
import Page, {
  jumpToTop,
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import PositionTable from "components/PositionTable"
import ReportCollection from "components/ReportCollection"
import SubNav from "components/SubNav"
import UltimatePagination from "components/UltimatePagination"
import FileSaver from "file-saver"
import { Field, Form, Formik } from "formik"
import GQL from "graphqlapi"
import { Organization, Person, Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React from "react"
import { Alert, Badge, Button, Modal, Nav, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { toast } from "react-toastify"
import DOWNLOAD_ICON from "resources/download.png"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"

const SEARCH_CONFIG = {
  [SEARCH_OBJECT_TYPES.REPORTS]: {
    listName: `${SEARCH_OBJECT_TYPES.REPORTS}: reportList`,
    sortBy: "ENGAGEMENT_DATE",
    sortOrder: "DESC",
    variableType: "ReportSearchQueryInput",
    fields: ReportCollection.GQL_REPORT_FIELDS
  },
  [SEARCH_OBJECT_TYPES.PEOPLE]: {
    listName: `${SEARCH_OBJECT_TYPES.PEOPLE}: personList`,
    sortBy: "NAME",
    sortOrder: "ASC",
    variableType: "PersonSearchQueryInput",
    fields:
      "uuid, name, rank, role, emailAddress, position { uuid, name, type, code, location { uuid, name }, organization { uuid, shortName} }"
  },
  [SEARCH_OBJECT_TYPES.POSITIONS]: {
    listName: `${SEARCH_OBJECT_TYPES.POSITIONS}: positionList`,
    sortBy: "NAME",
    sortOrder: "ASC",
    variableType: "PositionSearchQueryInput",
    fields:
      "uuid , name, code, type, status, location { uuid, name }, organization { uuid, shortName}, person { uuid, name, rank, role }"
  },
  [SEARCH_OBJECT_TYPES.TASKS]: {
    listName: `${SEARCH_OBJECT_TYPES.TASKS}: taskList`,
    sortBy: "NAME",
    sortOrder: "ASC",
    variableType: "TaskSearchQueryInput",
    fields: "uuid, shortName, longName"
  },
  [SEARCH_OBJECT_TYPES.LOCATIONS]: {
    listName: `${SEARCH_OBJECT_TYPES.LOCATIONS}: locationList`,
    sortBy: "NAME",
    sortOrder: "ASC",
    variableType: "LocationSearchQueryInput",
    fields: "uuid, name, lat, lng"
  },
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: {
    listName: `${SEARCH_OBJECT_TYPES.ORGANIZATIONS}: organizationList`,
    sortBy: "NAME",
    sortOrder: "ASC",
    variableType: "OrganizationSearchQueryInput",
    fields: "uuid, shortName, longName, identificationCode, type"
  }
}

class Search extends Page {
  static propTypes = {
    ...pagePropTypes,
    setPagination: PropTypes.func.isRequired,
    pagination: PropTypes.object
  }

  componentPrefix = "SEARCH_"
  state = {
    error: null,
    didSearch: false,
    query: this.props.searchQuery.text || null,
    results: {
      [SEARCH_OBJECT_TYPES.REPORTS]: null,
      people: null,
      organizations: null,
      positions: null,
      locations: null,
      tasks: null
    },
    showSaveSearch: false
  }

  getPaginatedNum = (part, pageNum = 0) => {
    let goToPageNum = pageNum
    if (part !== undefined) {
      goToPageNum = part.pageNum
    }
    return goToPageNum
  }

  getPaginated = type => {
    const { pagination } = this.props
    const searchType = SEARCH_OBJECT_TYPES[type]
    const pageLabel = this.pageLabel(type)
    return pagination[pageLabel]
  }

  pageLabel = (type, prefix = this.componentPrefix) => {
    return `${prefix}${type}`
  }

  getSearchPart(type, query, pageNum = 0, pageSize = 10) {
    const searchType = SEARCH_OBJECT_TYPES[type]
    let subQuery = Object.assign({}, query)
    subQuery.pageNum = pageNum
    subQuery.pageSize = pageSize
    let config = SEARCH_CONFIG[searchType]
    if (config.sortBy) {
      subQuery.sortBy = config.sortBy
    }
    if (config.sortOrder) {
      subQuery.sortOrder = config.sortOrder
    }
    let gqlPart = new GQL.Part(/* GraphQL */ `
      ${config.listName} (query:$${searchType}Query) {
        pageNum, pageSize, totalCount, list { ${config.fields} }
      }
      `).addVariable(searchType + "Query", config.variableType, subQuery)
    return gqlPart
  }

  @autobind
  _dataFetcher(props, callback, pageNum, pageSize) {
    const { searchQuery } = props
    const queryTypes = searchQuery.objectType
      ? { [SEARCH_OBJECT_TYPES[searchQuery.objectType]]: {} }
      : SEARCH_CONFIG
    const query = this.getSearchQuery(props)
    const parts = Object.keys(queryTypes).map(type => {
      const paginatedPart = this.getPaginated(type)
      const goToPageNum = this.getPaginatedNum(paginatedPart, pageNum)
      return this.getSearchPart(type, query, goToPageNum, pageSize)
    })
    return callback(parts)
  }

  @autobind
  _fetchDataCallback(parts) {
    return GQL.run(parts)
      .then(data => {
        this.setState({
          error: null,
          results: data,
          didSearch: true
        })
      })
      .catch(error => this.setState({ error: error, didSearch: true }))
  }

  fetchData(props) {
    return this._dataFetcher(props, this._fetchDataCallback)
  }

  render() {
    const { results, error } = this.state
    const numReports = results[SEARCH_OBJECT_TYPES.REPORTS] ? results[SEARCH_OBJECT_TYPES.REPORTS].totalCount : 0
    const numPeople = results[SEARCH_OBJECT_TYPES.PEOPLE] ? results[SEARCH_OBJECT_TYPES.PEOPLE].totalCount : 0
    const numPositions = results[SEARCH_OBJECT_TYPES.POSITIONS] ? results[SEARCH_OBJECT_TYPES.POSITIONS].totalCount : 0
    const numTasks = results[SEARCH_OBJECT_TYPES.TASKS] ? results[SEARCH_OBJECT_TYPES.TASKS].totalCount : 0
    const numLocations = results[SEARCH_OBJECT_TYPES.LOCATIONS] ? results[SEARCH_OBJECT_TYPES.LOCATIONS].totalCount : 0
    const numOrganizations = results[SEARCH_OBJECT_TYPES.ORGANIZATIONS]
      ? results[SEARCH_OBJECT_TYPES.ORGANIZATIONS].totalCount
      : 0

    const numResults =
      numReports +
      numPeople +
      numPositions +
      numLocations +
      numOrganizations +
      numTasks
    const noResults = numResults === 0

    const taskShortLabel = Settings.fields.task.shortLabel
    return (
      <div>
        <SubNav subnavElemId="search-nav">
          <div>
            <Button onClick={this.props.history.goBack} bsStyle="link">
              &lt; Return to previous page
            </Button>
          </div>
          <Nav stacked bsStyle="pills">
            <AnchorNavItem to="organizations" disabled={!numOrganizations}>
              <img src={ORGANIZATIONS_ICON} alt="" /> Organizations
              {numOrganizations > 0 && (
                <Badge pullRight>{numOrganizations}</Badge>
              )}
            </AnchorNavItem>

            <AnchorNavItem to="people" disabled={!numPeople}>
              <img src={PEOPLE_ICON} alt="" />{" "}
              {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.PEOPLE]}
              {numPeople > 0 && <Badge pullRight>{numPeople}</Badge>}
            </AnchorNavItem>

            <AnchorNavItem to="positions" disabled={!numPositions}>
              <img src={POSITIONS_ICON} alt="" />{" "}
              {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.POSITIONS]}
              {numPositions > 0 && <Badge pullRight>{numPositions}</Badge>}
            </AnchorNavItem>

            <AnchorNavItem to="tasks" disabled={!numTasks}>
              <img src={TASKS_ICON} alt="" />{" "}
              {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.TASKS]}
              {numTasks > 0 && <Badge pullRight>{numTasks}</Badge>}
            </AnchorNavItem>

            <AnchorNavItem to="locations" disabled={!numLocations}>
              <img src={LOCATIONS_ICON} alt="" />{" "}
              {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.LOCATIONS]}
              {numLocations > 0 && <Badge pullRight>{numLocations}</Badge>}
            </AnchorNavItem>

            <AnchorNavItem to="reports" disabled={!numReports}>
              <img src={REPORTS_ICON} alt="" />{" "}
              {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.REPORTS]}
              {numReports > 0 && <Badge pullRight>{numReports}</Badge>}
            </AnchorNavItem>
          </Nav>
        </SubNav>
        <div className="pull-right">
          {!noResults && (
            <Button
              onClick={this.exportSearchResults}
              id="exportSearchResultsButton"
              style={{ marginRight: 12 }}
              title="Export search results"
            >
              <img
                src={DOWNLOAD_ICON}
                height={16}
                alt="Export search results"
              />
            </Button>
          )}
          <Button
            onClick={this.openSaveModal}
            id="saveSearchButton"
            style={{ marginRight: 12 }}
          >
            Save search
          </Button>
        </div>
        <Messages error={error} /> {/* success is shown through toast */}
        {this.state.query && (
          <h2 className="only-show-for-print">
            Search query: '{this.state.query}'
          </h2>
        )}
        {this.state.didSearch && noResults && (
          <Alert bsStyle="warning">
            <b>No search results found!</b>
          </Alert>
        )}
        {numOrganizations > 0 && (
          <Fieldset id="organizations" title="Organizations">
            {this.renderOrgs()}
          </Fieldset>
        )}
        {numPeople > 0 && (
          <Fieldset id="people" title="People">
            {this.renderPeople()}
          </Fieldset>
        )}
        {numPositions > 0 && (
          <Fieldset id="positions" title="Positions">
            {this.renderPositions()}
          </Fieldset>
        )}
        {numTasks > 0 && (
          <Fieldset id="tasks" title={pluralize(taskShortLabel)}>
            {this.renderTasks()}
          </Fieldset>
        )}
        {numLocations > 0 && (
          <Fieldset id="locations" title="Locations">
            {this.renderLocations()}
          </Fieldset>
        )}
        {numReports > 0 && (
          <Fieldset id="reports" title="Reports">
            {this.renderReports()}
          </Fieldset>
        )}
        {this.renderSaveModal()}
      </div>
    )
  }

  @autobind
  paginationFor(type) {
    const { pageSize, totalCount } = this.state.results[type]
    const paginatedPart = this.getPaginated(type)
    const goToPage = this.getPaginatedNum(paginatedPart)
    const numPages = pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
    if (numPages === 1) {
      return
    }
    return (
      <header className="searchPagination">
        <UltimatePagination
          className="pull-right"
          currentPage={goToPage + 1}
          totalPages={numPages}
          boundaryPagesRange={1}
          siblingPagesRange={2}
          hideEllipsis={false}
          hidePreviousAndNextPageLinks={false}
          hideFirstAndLastPageLinks
          onChange={value => this.goToPage(type, value - 1)}
        />
      </header>
    )
  }

  @autobind
  goToPage(type, pageNum) {
    const { setPagination } = this.props
    const query = this.getSearchQuery()
    const part = this.getSearchPart(type, query, pageNum)
    GQL.run([part])
      .then(data => {
        let results = this.state.results // TODO: @nickjs this feels wrong, help!
        results[type] = data[type]
        this.setState({ results }, () =>
          setPagination(this.pageLabel(type), pageNum)
        )
      })
      .catch(error => this.setState({ error: error }))
  }

  renderReports() {
    const { results } = this.state
    const { pagination } = this.props
    const reports = results[SEARCH_OBJECT_TYPES.REPORTS]
    const paginatedPart =
      pagination[this.pageLabel(SEARCH_OBJECT_TYPES.REPORTS)]
    const goToPageNum = this.getPaginatedNum(paginatedPart)
    const paginatedReports = Object.assign(reports, { pageNum: goToPageNum })
    return (
      <ReportCollection
        paginatedReports={paginatedReports}
        goToPage={this.goToPage.bind(this, SEARCH_OBJECT_TYPES.REPORTS)}
      />
    )
  }

  renderPeople() {
    return (
      <div>
        {this.paginationFor(SEARCH_OBJECT_TYPES.PEOPLE)}
        <Table responsive hover striped className="people-search-results">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Location</th>
              <th>Organization</th>
            </tr>
          </thead>
          <tbody>
            {Person.map(this.state.results[SEARCH_OBJECT_TYPES.PEOPLE].list, person => (
              <tr key={person.uuid}>
                <td>
                  <LinkTo person={person} />
                </td>
                <td>
                  <LinkTo position={person.position} />
                  {person.position && person.position.code
                    ? `, ${person.position.code}`
                    : ""}
                </td>
                <td>
                  <LinkTo
                    whenUnspecified=""
                    anetLocation={person.position && person.position.location}
                  />
                </td>
                <td>
                  {person.position && person.position.organization && (
                    <LinkTo organization={person.position.organization} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  renderOrgs() {
    return (
      <div>
        {this.paginationFor(SEARCH_OBJECT_TYPES.ORGANIZATIONS)}
        <Table responsive hover striped id="organizations-search-results">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Code</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {Organization.map(this.state.results[SEARCH_OBJECT_TYPES.ORGANIZATIONS].list, org => (
              <tr key={org.uuid}>
                <td>
                  <LinkTo organization={org} />
                </td>
                <td>{org.longName}</td>
                <td>{org.identificationCode}</td>
                <td>{org.humanNameOfType()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  renderPositions() {
    return (
      <div>
        {this.paginationFor(SEARCH_OBJECT_TYPES.POSITIONS)}
        <PositionTable positions={this.state.results[SEARCH_OBJECT_TYPES.POSITIONS].list} />
      </div>
    )
  }

  renderLocations() {
    return (
      <div>
        {this.paginationFor(SEARCH_OBJECT_TYPES.LOCATIONS)}
        <Table responsive hover striped>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {this.state.results[SEARCH_OBJECT_TYPES.LOCATIONS].list.map(loc => (
              <tr key={loc.uuid}>
                <td>
                  <LinkTo anetLocation={loc} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  renderTasks() {
    return (
      <div>
        {this.paginationFor(SEARCH_OBJECT_TYPES.TASKS)}
        <Table responsive hover striped>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {Task.map(this.state.results[SEARCH_OBJECT_TYPES.TASKS].list, task => (
              <tr key={task.uuid}>
                <td>
                  <LinkTo task={task}>
                    {task.shortName} {task.longName}
                  </LinkTo>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  renderSaveModal() {
    return (
      <Modal show={this.state.showSaveSearch} onHide={this.closeSaveModal}>
        <Modal.Header closeButton>
          <Modal.Title>Save search</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Formik
            enableReinitialize
            onSubmit={this.onSubmitSaveSearch}
            initialValues={{ name: "" }}
          >
            {({ values, submitForm }) => {
              return (
                <Form>
                  <Field
                    name="name"
                    component={FieldHelper.renderInputField}
                    placeholder="Give this saved search a name"
                    vertical
                  />
                  <div className="submit-buttons">
                    <div>
                      <Button
                        id="saveSearchModalSubmitButton"
                        bsStyle="primary"
                        type="button"
                        onClick={submitForm}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </Form>
              )
            }}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }

  onSubmitSaveSearch = (values, form) => {
    this.saveSearch(values, form)
      .then(response => this.onSubmitSaveSearchSuccess(response, values, form))
      .catch(error => {
        this.setState(
          {
            error: error,
            showSaveSearch: false
          },
          () => {
            form.setSubmitting(false)
            jumpToTop()
          }
        )
      })
  }

  onSubmitSaveSearchSuccess = (response, values, form) => {
    if (response.createSavedSearch.uuid) {
      toast.success("Search saved")
      this.setState({
        error: null,
        showSaveSearch: false
      })
    }
  }

  saveSearch = (values, form) => {
    const savedSearch = {
      name: values.name,
      query: JSON.stringify(this.getSearchQuery())
    }
    if (this.props.searchQuery.objectType) {
      savedSearch.objectType =
        SEARCH_OBJECT_TYPES[this.props.searchQuery.objectType]
    }
    const operation = "createSavedSearch"
    let graphql = operation + "(savedSearch: $savedSearch) { uuid }"
    const variables = { savedSearch: savedSearch }
    const variableDef = "($savedSearch: SavedSearchInput!)"
    return API.mutation(graphql, variables, variableDef)
  }

  @autobind
  openSaveModal() {
    this.setState({ showSaveSearch: true })
  }

  @autobind
  closeSaveModal() {
    this.setState({ showSaveSearch: false })
  }

  @autobind
  _exportSearchResultsCallback(parts) {
    GQL.runExport(parts, "xlsx")
      .then(blob => {
        FileSaver.saveAs(blob, "anet_export.xlsx")
      })
      .catch(error => this.setState({ error: error }))
  }

  @autobind
  exportSearchResults() {
    this._dataFetcher(this.props, this._exportSearchResultsCallback, 0, 0)
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery,
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Search))
