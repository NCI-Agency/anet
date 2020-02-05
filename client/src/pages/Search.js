import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_LABELS,
  SEARCH_OBJECT_TYPES,
  setPagination
} from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { AnchorNavItem } from "components/Nav"
import {
  PageDispatchersPropType,
  jumpToTop,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import PositionTable from "components/PositionTable"
import ReportCollection from "components/ReportCollection"
import {
  SearchDescription,
  SearchQueryPropType,
  getSearchQuery
} from "components/SearchFilters"
import SubNav from "components/SubNav"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import { exportResults } from "exportUtils"
import { Field, Form, Formik } from "formik"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Organization, Person, Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Dropdown,
  MenuItem,
  Modal,
  Nav,
  Table
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import { toast } from "react-toastify"
import DOWNLOAD_ICON from "resources/download.png"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"

const GQL_CREATE_SAVED_SEARCH = gql`
  mutation($savedSearch: SavedSearchInput!) {
    createSavedSearch(savedSearch: $savedSearch) {
      uuid
    }
  }
`
const GQL_GET_ORGANIZATION_LIST = gql`
  query($organizationQuery: OrganizationSearchQueryInput) {
    organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        identificationCode
        type
      }
    }
  }
`
const GQL_GET_PERSON_LIST = gql`
  query($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        role
        emailAddress
        avatar(size: 32)
        position {
          uuid
          name
          type
          code
          location {
            uuid
            name
          }
          organization {
            uuid
            shortName
          }
        }
      }
    }
  }
`
const GQL_GET_POSITION_LIST = gql`
  query($positionQuery: PositionSearchQueryInput) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        status
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
    }
  }
`
const GQL_GET_TASK_LIST = gql`
  query($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
      }
    }
  }
`
const GQL_GET_LOCATION_LIST = gql`
  query($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        lat
        lng
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

const Organizations = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const organizationQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION_LIST, {
    organizationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    // Reset the total count
    setTotalCount(null)
    return result
  }

  const organizations = data ? data.organizationList.list : []
  const totalCount =
    data && data.organizationList && data.organizationList.totalCount
  setTotalCount(totalCount)
  if (_get(organizations, "length", 0) === 0) {
    return <em>No organizations found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={organizationQuery.pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
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
            {Organization.map(organizations, org => (
              <tr key={org.uuid}>
                <td>
                  <LinkTo modelType="Organization" model={org} />
                </td>
                <td>{org.longName}</td>
                <td>{org.identificationCode}</td>
                <td>{org.humanNameOfType()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

Organizations.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired
}

const People = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const personQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON_LIST, {
    personQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    // Reset the total count
    setTotalCount(null)
    return result
  }

  const people = data ? data.personList.list : []
  const totalCount = data && data.personList && data.personList.totalCount
  setTotalCount(totalCount)
  if (_get(people, "length", 0) === 0) {
    return <em>No people found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={personQuery.pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
        <Table responsive hover striped id="people-search-results">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Location</th>
              <th>Organization</th>
            </tr>
          </thead>
          <tbody>
            {Person.map(people, person => (
              <tr key={person.uuid}>
                <td>
                  <LinkTo modelType="Person" model={person} />
                </td>
                <td>
                  <LinkTo modelType="Position" model={person.position} />
                  {person.position && person.position.code
                    ? `, ${person.position.code}`
                    : ""}
                </td>
                <td>
                  <LinkTo
                    modelType="Location"
                    model={person.position && person.position.location}
                    whenUnspecified=""
                  />
                </td>
                <td>
                  {person.position && person.position.organization && (
                    <LinkTo
                      modelType="Organization"
                      model={person.position.organization}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

People.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired
}

const Positions = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const positionQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    // Reset the total count
    setTotalCount(null)
    return result
  }

  const paginatedPositions = data ? data.positionList : []
  const {
    pageSize,
    pageNum: curPage,
    totalCount,
    list: positions
  } = paginatedPositions
  setTotalCount(totalCount)

  return (
    <PositionTable
      positions={positions}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      id="positions-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

Positions.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired
}

const Tasks = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const taskQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    // Reset the total count
    setTotalCount(null)
    return result
  }

  const tasks = data ? data.taskList.list : []
  const totalCount = data && data.taskList && data.taskList.totalCount
  setTotalCount(totalCount)
  if (_get(tasks, "length", 0) === 0) {
    return <em>No tasks found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={taskQuery.pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
        <Table responsive hover striped id="tasks-search-results">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {Task.map(tasks, task => (
              <tr key={task.uuid}>
                <td>
                  <LinkTo modelType="Task" model={task}>
                    {task.shortName} {task.longName}
                  </LinkTo>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

Tasks.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired
}

const Locations = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const locationQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION_LIST, {
    locationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    // Reset the total count
    setTotalCount(null)
    return result
  }

  const locations = data ? data.locationList.list : []
  const totalCount = data && data.locationList && data.locationList.totalCount
  setTotalCount(totalCount)
  if (_get(locations, "length", 0) === 0) {
    return <em>No locations found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={locationQuery.pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
        <Table responsive hover striped id="locations-search-results">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.uuid}>
                <td>
                  <LinkTo modelType="Location" model={loc} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

Locations.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired
}

const sum = (...args) => {
  return args.reduce((prev, curr) => (curr === null ? prev : prev + curr))
}

const Search = ({
  pageDispatchers,
  searchQuery,
  pagination,
  setPagination
}) => {
  const history = useHistory()
  const [error, setError] = useState(null)
  const [showSaveSearch, setShowSaveSearch] = useState(false)
  const [numOrganizations, setNumOrganizations] = useState(null)
  const [numPeople, setNumPeople] = useState(null)
  const [numPositions, setNumPositions] = useState(null)
  const [numTasks, setNumTasks] = useState(null)
  const [numLocations, setNumLocations] = useState(null)
  const [numReports, setNumReports] = useState(null)
  const numResults = sum(
    numOrganizations,
    numPeople,
    numPositions,
    numTasks,
    numLocations,
    numReports
  )
  const taskShortLabel = Settings.fields.task.shortLabel
  // Memo'ize the search query parameters we use to prevent unnecessary re-renders
  const searchQueryParams = useMemo(() => getSearchQuery(searchQuery), [
    searchQuery
  ])
  const genericSearchQueryParams = useMemo(
    () =>
      Object.assign({}, searchQueryParams, {
        sortBy: "NAME",
        sortOrder: "ASC"
      }),
    [searchQueryParams]
  )
  const reportsSearchQueryParams = useMemo(
    () =>
      Object.assign({}, searchQueryParams, {
        sortBy: "ENGAGEMENT_DATE",
        sortOrder: "DESC"
      }),
    [searchQueryParams]
  )
  const queryTypes = _isEmpty(searchQueryParams)
    ? []
    : searchQuery.objectType
      ? [searchQuery.objectType]
      : Object.keys(SEARCH_OBJECT_TYPES)
  const hasOrganizationsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.ORGANIZATIONS) &&
    numOrganizations > 0
  const hasPeopleResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.PEOPLE) && numPeople > 0
  const hasPositionsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.POSITIONS) && numPositions > 0
  const hasTasksResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.TASKS) && numTasks > 0
  const hasLocationsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.LOCATIONS) && numLocations > 0
  const hasReportsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.REPORTS) && numReports > 0
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return (
    <div>
      <SubNav subnavElemId="search-nav">
        <div>
          <Button onClick={history.goBack} bsStyle="link">
            &lt; Return to previous page
          </Button>
        </div>
        <Nav stacked bsStyle="pills">
          <AnchorNavItem to="organizations" disabled={!hasOrganizationsResults}>
            <img src={ORGANIZATIONS_ICON} alt="" /> Organizations
            {hasOrganizationsResults && (
              <Badge pullRight>{numOrganizations}</Badge>
            )}
          </AnchorNavItem>

          <AnchorNavItem to="people" disabled={!hasPeopleResults}>
            <img src={PEOPLE_ICON} alt="" />{" "}
            {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.PEOPLE]}
            {hasPeopleResults && <Badge pullRight>{numPeople}</Badge>}
          </AnchorNavItem>

          <AnchorNavItem to="positions" disabled={!hasPositionsResults}>
            <img src={POSITIONS_ICON} alt="" />{" "}
            {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.POSITIONS]}
            {hasPositionsResults && <Badge pullRight>{numPositions}</Badge>}
          </AnchorNavItem>

          <AnchorNavItem to="tasks" disabled={!hasTasksResults}>
            <img src={TASKS_ICON} alt="" />{" "}
            {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.TASKS]}
            {hasTasksResults && <Badge pullRight>{numTasks}</Badge>}
          </AnchorNavItem>

          <AnchorNavItem to="locations" disabled={!hasLocationsResults}>
            <img src={LOCATIONS_ICON} alt="" />{" "}
            {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.LOCATIONS]}
            {hasLocationsResults && <Badge pullRight>{numLocations}</Badge>}
          </AnchorNavItem>

          <AnchorNavItem to="reports" disabled={!hasReportsResults}>
            <img src={REPORTS_ICON} alt="" />{" "}
            {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.REPORTS]}
            {hasReportsResults && <Badge pullRight>{numReports}</Badge>}
          </AnchorNavItem>
        </Nav>
      </SubNav>
      <div className="pull-right">
        {numResults > 0 && (
          <Dropdown id="dropdown-custom-1">
            <Dropdown.Toggle>
              Export{" "}
              <img
                src={DOWNLOAD_ICON}
                height={16}
                alt="Export search results"
              />
            </Dropdown.Toggle>
            {/* TODO: Show a warning when there are more than exportUtils.MAX_NR_OF_EXPORTS results */}
            <Dropdown.Menu className="super-colors">
              <MenuItem
                onClick={() =>
                  exportResults(searchQueryParams, queryTypes, "xlsx", setError)}
              >
                Excel (xlsx)
              </MenuItem>
              <MenuItem
                onClick={() =>
                  exportResults(searchQueryParams, queryTypes, "kml", setError)}
              >
                Google Earth (kml)
              </MenuItem>
              <MenuItem
                onClick={() =>
                  exportResults(searchQueryParams, queryTypes, "nvg", setError)}
              >
                NATO Vector Graphics (nvg)
              </MenuItem>
            </Dropdown.Menu>
          </Dropdown>
        )}
        {!_isEmpty(searchQueryParams) && numResults >= 0 && (
          <Button
            onClick={openSaveModal}
            id="saveSearchButton"
            style={{ marginRight: 12 }}
          >
            Save search
          </Button>
        )}
      </div>
      <Messages error={error} /> {/* success is shown through toast */}
      {!_isEmpty(searchQueryParams) && (
        <h2 className="only-show-for-print">
          Search query: {searchQuery.text}
          <br />
          Filters: <SearchDescription searchQuery={searchQuery} />
        </h2>
      )}
      {_isEmpty(searchQueryParams) && (
        <Alert bsStyle="warning">
          <b>You did not enter any search criteria.</b>
        </Alert>
      )}
      {!_isEmpty(searchQueryParams) && numResults === 0 && (
        <Alert bsStyle="warning">
          <b>No search results found!</b>
        </Alert>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.ORGANIZATIONS) && (
        <Fieldset id="organizations" title="Organizations">
          <Organizations
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumOrganizations}
            paginationKey="SEARCH_organizations"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.PEOPLE) && (
        <Fieldset id="people" title="People">
          <People
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumPeople}
            paginationKey="SEARCH_people"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.POSITIONS) && (
        <Fieldset id="positions" title="Positions">
          <Positions
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumPositions}
            paginationKey="SEARCH_positions"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.TASKS) && (
        <Fieldset id="tasks" title={pluralize(taskShortLabel)}>
          <Tasks
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumTasks}
            paginationKey="SEARCH_tasks"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.LOCATIONS) && (
        <Fieldset id="locations" title="Locations">
          <Locations
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumLocations}
            paginationKey="SEARCH_locations"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.REPORTS) && (
        <Fieldset id="reports" title="Reports">
          <ReportCollection
            queryParams={reportsSearchQueryParams}
            setTotalCount={setNumReports}
            paginationKey="SEARCH_reports"
          />
        </Fieldset>
      )}
      {renderSaveModal()}
    </div>
  )

  function renderSaveModal() {
    return (
      <Modal show={showSaveSearch} onHide={closeSaveModal}>
        <Modal.Header closeButton>
          <Modal.Title>Save search</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Formik
            enableReinitialize
            onSubmit={onSubmitSaveSearch}
            initialValues={{ name: "" }}
          >
            {({ values, submitForm }) => {
              return (
                <Form>
                  <Field
                    name="name"
                    component={FieldHelper.InputField}
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

  function onSubmitSaveSearch(values, form) {
    saveSearch(values, form)
      .then(response => onSubmitSaveSearchSuccess(response, values, form))
      .catch(error => {
        setError(error)
        setShowSaveSearch(false)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSaveSearchSuccess(response, values, form) {
    if (response.createSavedSearch.uuid) {
      toast.success("Search saved")
      setError(null)
      setShowSaveSearch(false)
    }
  }

  function saveSearch(values, form) {
    const savedSearch = {
      name: values.name,
      query: JSON.stringify(getSearchQuery(searchQuery))
    }
    if (searchQuery.objectType) {
      savedSearch.objectType = SEARCH_OBJECT_TYPES[searchQuery.objectType]
    }
    return API.mutation(GQL_CREATE_SAVED_SEARCH, { savedSearch })
  }

  function openSaveModal() {
    setShowSaveSearch(true)
  }

  function closeSaveModal() {
    setShowSaveSearch(false)
  }
}

Search.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  searchQuery: SearchQueryPropType
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setPagination: (pageKey, pageNum) =>
      dispatch(setPagination(pageKey, pageNum)),
    ...pageDispatchers
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery,
  pagination: state.pagination
})

export default connect(mapStateToProps, mapDispatchToProps)(Search)
