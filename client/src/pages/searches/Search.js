import { gql } from "@apollo/client"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_LABELS,
  SEARCH_OBJECT_TYPES,
  setPagination
} from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LocationTable from "components/LocationTable"
import Messages from "components/Messages"
import { AnchorNavItem } from "components/Nav"
import OrganizationTable from "components/OrganizationTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PersonTable from "components/PersonTable"
import PositionTable from "components/PositionTable"
import ReportCollection from "components/ReportCollection"
import {
  getSearchQuery,
  SearchDescription,
  SearchQueryPropType
} from "components/SearchFilters"
import SubNav from "components/SubNav"
import TaskTable from "components/TaskTable"
import { exportResults } from "exportUtils"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Container,
  Dropdown,
  FormSelect,
  Modal,
  Nav,
  OverlayTrigger,
  Row,
  Tooltip
} from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import AUTHORIZATION_GROUPS_ICON from "resources/authorizationGroups.png"
import DOWNLOAD_ICON from "resources/download.png"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

// By default limit exports to the first 1000 results
const MAX_NR_OF_EXPORTS = 1000
export const UNLIMITED_EXPORTS_AUTHORIZATION_GROUP =
  "UNLIMITED_EXPORTS_AUTHORIZATION_GROUP"

const GQL_EMAIL_ADDRESSES = `
  emailAddresses(network: $emailNetwork) {
    network
    address
  }
`
const GQL_CREATE_SAVED_SEARCH = gql`
  mutation ($savedSearch: SavedSearchInput!) {
    createSavedSearch(savedSearch: $savedSearch) {
      uuid
    }
  }
`
const GQL_GET_ORGANIZATION_LIST = gql`
  query (
    $organizationQuery: OrganizationSearchQueryInput
    $emailNetwork: String
  ) {
    organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        identificationCode
        ${GQL_EMAIL_ADDRESSES}
      }
    }
  }
`
const GQL_GET_PERSON_LIST = gql`
  query ($personQuery: PersonSearchQueryInput, $emailNetwork: String) {
    personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        avatarUuid
        ${GQL_EMAIL_ADDRESSES}
        position {
          uuid
          name
          type
          role
          code
          location {
            uuid
            name
          }
          organization {
            uuid
            shortName
            longName
            identificationCode
          }
        }
      }
    }
  }
`
const GQL_GET_POSITION_LIST = gql`
  query ($positionQuery: PositionSearchQueryInput, $emailNetwork: String) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        role
        status
        ${GQL_EMAIL_ADDRESSES}
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
        }
        person {
          uuid
          name
          rank
          avatarUuid
        }
      }
    }
  }
`
const GQL_GET_TASK_LIST = gql`
  query ($taskQuery: TaskSearchQueryInput) {
    taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
      }
    }
  }
`
const GQL_GET_LOCATION_LIST = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        lat
        lng
        type
      }
    }
  }
`
const GQL_GET_AUTHORIZATION_GROUP_LIST = gql`
  query (
    $authorizationGroupQuery: AuthorizationGroupSearchQueryInput
    $emailNetwork: String
  ) {
    authorizationGroupList(query: $authorizationGroupQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        description
        status
        authorizationGroupRelatedObjects {
          relatedObjectType
          relatedObjectUuid
          relatedObject {
            ... on Organization {
              uuid
              shortName
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Person {
              uuid
              name
              rank
              avatarUuid
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Position {
              uuid
              type
              name
              ${GQL_EMAIL_ADDRESSES}
            }
          }
        }
      }
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 10

const Organizations = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  const [selectedEmailAddresses, setSelectedEmailAddresses] = useState(
    new Map()
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
      setSelectedEmailAddresses(new Map())
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const organizationQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION_LIST, {
    organizationQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.organizationList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedOrganizations = data ? data.organizationList : []
  const {
    pageSize,
    pageNum: curPage,
    list: organizations
  } = paginatedOrganizations

  return (
    <OrganizationTable
      organizations={organizations}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      allowSelection={allowSelection}
      selection={selectedEmailAddresses}
      isAllSelected={isAllSelected}
      toggleAll={toggleAll}
      isSelected={isSelected}
      toggleSelection={toggleSelection}
      id="organizations-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isAllSelected() {
    return _isAllSelected(organizations, selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      organizations,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }

  function isSelected(uuid) {
    return _isSelected(uuid, selectedEmailAddresses)
  }

  function toggleSelection(uuid, emailAddresses) {
    _toggleSelection(
      uuid,
      emailAddresses,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }
}

Organizations.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  allowSelection: PropTypes.bool,
  updateRecipients: PropTypes.func
}

const People = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  const [selectedEmailAddresses, setSelectedEmailAddresses] = useState(
    new Map()
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
      setSelectedEmailAddresses(new Map())
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const personQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON_LIST, {
    personQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.personList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedPeople = data ? data.personList : []
  const { pageSize, pageNum: curPage, list: people } = paginatedPeople

  return (
    <PersonTable
      people={people}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      allowSelection={allowSelection}
      selection={selectedEmailAddresses}
      isAllSelected={isAllSelected}
      toggleAll={toggleAll}
      isSelected={isSelected}
      toggleSelection={toggleSelection}
      id="people-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isAllSelected() {
    return _isAllSelected(people, selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      people,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }

  function isSelected(uuid) {
    return _isSelected(uuid, selectedEmailAddresses)
  }

  function toggleSelection(uuid, emailAddresses) {
    _toggleSelection(
      uuid,
      emailAddresses,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }
}

People.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  allowSelection: PropTypes.bool,
  updateRecipients: PropTypes.func
}

const Positions = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  const [selectedEmailAddresses, setSelectedEmailAddresses] = useState(
    new Map()
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
      setSelectedEmailAddresses(new Map())
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const positionQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery,
    emailNetwork
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.positionList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedPositions = data ? data.positionList : []
  const { pageSize, pageNum: curPage, list: positions } = paginatedPositions

  return (
    <PositionTable
      positions={positions}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      allowSelection={allowSelection}
      selection={selectedEmailAddresses}
      isAllSelected={isAllSelected}
      toggleAll={toggleAll}
      isSelected={isSelected}
      toggleSelection={toggleSelection}
      id="positions-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function isAllSelected() {
    return _isAllSelected(positions, selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      positions,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }

  function isSelected(uuid) {
    return _isSelected(uuid, selectedEmailAddresses)
  }

  function toggleSelection(uuid, emailAddresses) {
    _toggleSelection(
      uuid,
      emailAddresses,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }
}

Positions.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  allowSelection: PropTypes.bool,
  updateRecipients: PropTypes.func
}

export const Tasks = ({
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
  const taskQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_TASK_LIST, {
    taskQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.taskList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedTasks = data ? data.taskList : []
  const { pageSize, pageNum: curPage, list: tasks } = paginatedTasks

  return (
    <TaskTable
      tasks={tasks}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      id="tasks-search-results"
    />
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
  const locationQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION_LIST, {
    locationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.locationList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedLocations = data ? data.locationList : []
  const { pageSize, pageNum: curPage, list: locations } = paginatedLocations

  return (
    <LocationTable
      locations={locations}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      id="locations-search-results"
    />
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

const AuthorizationGroups = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  allowSelection,
  updateRecipients
}) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  const [selectedEmailAddresses, setSelectedEmailAddresses] = useState(
    new Map()
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
      setSelectedEmailAddresses(new Map())
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const authorizationGroupQuery = {
    ...queryParams,
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  }
  const { emailNetwork } = queryParams
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_AUTHORIZATION_GROUP_LIST,
    {
      authorizationGroupQuery,
      emailNetwork
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.authorizationGroupList?.totalCount
  useEffect(() => setTotalCount?.(totalCount), [setTotalCount, totalCount])
  if (done) {
    return result
  }

  const paginatedAuthorizationGroups = data ? data.authorizationGroupList : []
  const {
    pageSize,
    pageNum: curPage,
    list: authorizationGroups
  } = paginatedAuthorizationGroups

  return (
    <AuthorizationGroupTable
      authorizationGroups={authorizationGroups}
      showMembers
      showStatus
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPage}
      allowSelection={allowSelection}
      selection={selectedEmailAddresses}
      isAllSelected={isAllSelected}
      toggleAll={toggleAll}
      isSelected={isSelected}
      toggleSelection={toggleSelection}
      id="authorizationGroups-search-results"
    />
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }

  function getListWithEmailAddresses() {
    return authorizationGroups.map(ag => ({
      uuid: ag.uuid,
      emailAddresses: ag.authorizationGroupRelatedObjects.flatMap(
        agro => agro.relatedObject?.emailAddresses
      )
    }))
  }

  function isAllSelected() {
    return _isAllSelected(getListWithEmailAddresses(), selectedEmailAddresses)
  }

  function toggleAll() {
    _toggleAll(
      getListWithEmailAddresses(),
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }

  function isSelected(uuid) {
    return _isSelected(uuid, selectedEmailAddresses)
  }

  function toggleSelection(uuid, emailAddresses) {
    _toggleSelection(
      uuid,
      emailAddresses,
      selectedEmailAddresses,
      setSelectedEmailAddresses,
      updateRecipients
    )
  }
}

AuthorizationGroups.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  allowSelection: PropTypes.bool,
  updateRecipients: PropTypes.func
}

const sum = (...args) => {
  return args.reduce((prev, curr) => (curr === null ? prev : prev + curr))
}

function _isSubsetOf(set, subset) {
  return new Set([...set, ...subset]).size === set.size
}

function _isAllSelected(list, selectedEmailAddresses) {
  const selectedUuids = new Set(selectedEmailAddresses?.keys())
  if (_isEmpty(selectedUuids)) {
    return false // nothing selected
  }
  const isSubset = _isSubsetOf(
    selectedUuids,
    list.map(l => l.uuid)
  )
  return isSubset || null // return indeterminate if only some are selected
}

function _toggleAll(
  list,
  selectedEmailAddresses,
  setSelectedEmailAddresses,
  updateRecipients
) {
  if (_isAllSelected(list, selectedEmailAddresses)) {
    list.forEach(l => selectedEmailAddresses.delete(l.uuid))
  } else {
    list.forEach(l => selectedEmailAddresses.set(l.uuid, l.emailAddresses))
  }
  _updateSelection(
    selectedEmailAddresses,
    setSelectedEmailAddresses,
    updateRecipients
  )
}

function _isSelected(uuid, setSelectedEmailAddresses) {
  return setSelectedEmailAddresses.has(uuid)
}

function _toggleSelection(
  uuid,
  emailAddresses,
  selectedEmailAddresses,
  setSelectedEmailAddresses,
  updateRecipients
) {
  if (_isSelected(uuid, selectedEmailAddresses)) {
    selectedEmailAddresses.delete(uuid)
  } else {
    selectedEmailAddresses.set(uuid, emailAddresses)
  }
  _updateSelection(
    selectedEmailAddresses,
    setSelectedEmailAddresses,
    updateRecipients
  )
}

function _updateSelection(
  selectedEmailAddresses,
  setSelectedEmailAddresses,
  updateRecipients
) {
  const newSelection = new Map(selectedEmailAddresses)
  setSelectedEmailAddresses(newSelection)
  updateRecipients(newSelection)
}

const DEFAULT_RECIPIENTS = {
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: new Map(),
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: new Map(),
  [SEARCH_OBJECT_TYPES.PEOPLE]: new Map(),
  [SEARCH_OBJECT_TYPES.POSITIONS]: new Map()
}

const Search = ({
  pageDispatchers,
  searchQuery,
  pagination,
  setPagination
}) => {
  const { currentUser, appSettings } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [showSaveSearch, setShowSaveSearch] = useState(false)
  const [numOrganizations, setNumOrganizations] = useState(null)
  const [numPeople, setNumPeople] = useState(null)
  const [numPositions, setNumPositions] = useState(null)
  const [numTasks, setNumTasks] = useState(null)
  const [numLocations, setNumLocations] = useState(null)
  const [numReports, setNumReports] = useState(null)
  const [numAuthorizationGroups, setNumAuthorizationGroups] = useState(null)
  const [recipients, setRecipients] = useState({ ...DEFAULT_RECIPIENTS })
  usePageTitle("Search")
  const numResultsThatCanBeEmailed = sum(
    numOrganizations,
    numPeople,
    numPositions,
    numAuthorizationGroups
  )
  const numResults = sum(
    numResultsThatCanBeEmailed,
    numTasks,
    numLocations,
    numReports
  )
  const taskShortLabel = Settings.fields.task.shortLabel
  // Memo'ize the search query parameters we use to prevent unnecessary re-renders
  const searchQueryParams = useMemo(
    () => getSearchQuery(searchQuery),
    [searchQuery]
  )
  const withEmail = !!searchQueryParams.emailNetwork
  const genericSearchQueryParams = useMemo(
    () => ({
      ...searchQueryParams,
      pageSize,
      sortBy: "NAME",
      sortOrder: "ASC"
    }),
    [searchQueryParams, pageSize]
  )
  const reportsSearchQueryParams = useMemo(
    () => ({
      ...searchQueryParams,
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC"
    }),
    [searchQueryParams]
  )
  const exportMaxResults = currentUser?.authorizationGroups
    ?.map(ag => ag.uuid)
    ?.includes(appSettings[UNLIMITED_EXPORTS_AUTHORIZATION_GROUP])
    ? 0
    : MAX_NR_OF_EXPORTS

  const queryTypes = useMemo(
    () =>
      searchQuery.objectType
        ? [searchQuery.objectType]
        : Object.keys(SEARCH_OBJECT_TYPES),
    [searchQuery.objectType]
  )
  const latestQuery = useRef({ queryTypes, searchQueryParams })
  const queryUnchanged = _isEqual(latestQuery.current, {
    queryTypes,
    searchQueryParams
  })
  useEffect(() => {
    if (!queryUnchanged) {
      latestQuery.current = { queryTypes, searchQueryParams }
      setNumAuthorizationGroups(0)
      setNumLocations(0)
      setNumOrganizations(0)
      setNumPeople(0)
      setNumPositions(0)
      setNumReports(0)
      setNumTasks(0)
      setRecipients({ ...DEFAULT_RECIPIENTS })
    }
  }, [
    queryUnchanged,
    queryTypes,
    searchQueryParams,
    setRecipients,
    setNumAuthorizationGroups,
    setNumLocations,
    setNumOrganizations,
    setNumPeople,
    setNumPositions,
    setNumReports,
    setNumTasks
  ])
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
  const hasAuthorizationGroupsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS) &&
    numAuthorizationGroups > 0
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  const prepareEmailButtonProps = getPrepareEmailButtonProps()

  return (
    <div>
      <SubNav subnavElemId="search-nav">
        <Container className="p-0">
          <Row style={{ paddingLeft: 0 }}>
            <div>
              <Button onClick={() => navigate(-1)} variant="link" size="sm">
                &lt; Return to previous page
              </Button>
            </div>
          </Row>
          <Row style={{ paddingLeft: "2rem", marginBottom: "5px" }}>
            <Nav variant="pills" className="flex-column">
              <AnchorNavItem
                to="organizations"
                disabled={!hasOrganizationsResults}
              >
                <img src={ORGANIZATIONS_ICON} alt="" /> Organizations{" "}
                {hasOrganizationsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numOrganizations}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="people" disabled={!hasPeopleResults}>
                <img src={PEOPLE_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.PEOPLE]}{" "}
                {hasPeopleResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numPeople}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="positions" disabled={!hasPositionsResults}>
                <img src={POSITIONS_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.POSITIONS]}{" "}
                {hasPositionsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numPositions}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="tasks" disabled={!hasTasksResults}>
                <img src={TASKS_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.TASKS]}{" "}
                {hasTasksResults && (
                  <Badge
                    pill
                    bg="secondary"
                    className="float-end"
                    style={{ marginLeft: "10px" }}
                  >
                    {numTasks}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="locations" disabled={!hasLocationsResults}>
                <img src={LOCATIONS_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.LOCATIONS]}{" "}
                {hasLocationsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numLocations}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="reports" disabled={!hasReportsResults}>
                <img src={REPORTS_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.REPORTS]}{" "}
                {hasReportsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numReports}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem
                to="authorizationGroups"
                disabled={!hasAuthorizationGroupsResults}
              >
                <img src={AUTHORIZATION_GROUPS_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]}{" "}
                {hasAuthorizationGroupsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numAuthorizationGroups}
                  </Badge>
                )}
              </AnchorNavItem>
            </Nav>
          </Row>
        </Container>
      </SubNav>
      <div className="d-flex justify-content-end">
        {withEmail && numResultsThatCanBeEmailed > 0 && (
          <OverlayTrigger
            placement="bottom"
            overlay={
              <Tooltip id="prepareEmailButton-tooltip">
                {prepareEmailButtonProps.tooltip}
              </Tooltip>
            }
          >
            <span className="me-2">
              <Button
                href={prepareEmailButtonProps.href}
                id="prepareEmailButton"
                variant={prepareEmailButtonProps.variant}
                disabled={prepareEmailButtonProps.disabled}
              >
                {prepareEmailButtonProps.text}
              </Button>
            </span>
          </OverlayTrigger>
        )}
        {numResults > 0 && (
          <>
            <Dropdown id="dropdown-custom-1">
              <Dropdown.Toggle variant="outline-secondary">
                Export{" "}
                <img
                  src={DOWNLOAD_ICON}
                  height={16}
                  alt="Export search results"
                />
              </Dropdown.Toggle>
              {/* TODO: Show a warning when there are more than exportUtils.MAX_NR_OF_EXPORTS results */}
              <Dropdown.Menu className="super-colors">
                <Dropdown.Item
                  onClick={() =>
                    exportResults(
                      searchQueryParams,
                      queryTypes,
                      "xlsx",
                      exportMaxResults,
                      setError
                    )}
                >
                  Excel (xlsx)
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    exportResults(
                      searchQueryParams,
                      queryTypes,
                      "kml",
                      exportMaxResults,
                      setError
                    )}
                >
                  Google Earth (kml)
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    exportResults(
                      searchQueryParams,
                      queryTypes,
                      "nvg",
                      exportMaxResults,
                      setError
                    )}
                >
                  NATO Vector Graphics (nvg)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <span className="ms-2">
              <Button
                onClick={openSaveModal}
                id="saveSearchButton"
                variant="outline-secondary"
              >
                Save search
              </Button>
            </span>
            <div className="ms-2">
              Results per page:
              <FormSelect
                defaultValue={pageSize}
                onChange={e =>
                  setPageSize(parseInt(e.target.value, 10) || DEFAULT_PAGESIZE)}
              >
                {PAGESIZES.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </FormSelect>
            </div>
          </>
        )}
      </div>
      <Messages error={error} /> {/* success is shown through toast */}
      <h4 className="d-none d-print-block">
        Search query: {searchQuery.text}
        <br />
        Filters: <SearchDescription searchQuery={searchQuery} />
      </h4>
      {numResults === 0 && (
        <Alert variant="warning">
          <b>No search results found!</b>
        </Alert>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.ORGANIZATIONS) && (
        <Fieldset
          id="organizations"
          title={
            <>
              Organizations
              {hasOrganizationsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numOrganizations}
                </Badge>
              )}
            </>
          }
        >
          <Organizations
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumOrganizations}
            paginationKey="SEARCH_organizations"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.ORGANIZATIONS, r)}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.PEOPLE) && (
        <Fieldset
          id="people"
          title={
            <>
              People
              {hasPeopleResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numPeople}
                </Badge>
              )}
            </>
          }
        >
          <People
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumPeople}
            paginationKey="SEARCH_people"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.PEOPLE, r)}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.POSITIONS) && (
        <Fieldset
          id="positions"
          title={
            <>
              Positions
              {hasPositionsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numPositions}
                </Badge>
              )}
            </>
          }
        >
          <Positions
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumPositions}
            paginationKey="SEARCH_positions"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.POSITIONS, r)}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.TASKS) && !withEmail && (
        <Fieldset
          id="tasks"
          title={
            <>
              {pluralize(taskShortLabel)}
              {hasTasksResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numTasks}
                </Badge>
              )}
            </>
          }
        >
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
      {queryTypes.includes(SEARCH_OBJECT_TYPES.LOCATIONS) && !withEmail && (
        <Fieldset
          id="locations"
          title={
            <>
              Locations
              {hasLocationsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numLocations}
                </Badge>
              )}
            </>
          }
        >
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
      {queryTypes.includes(SEARCH_OBJECT_TYPES.REPORTS) && !withEmail && (
        <Fieldset
          id="reports"
          title={
            <>
              Reports
              {hasReportsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numReports}
                </Badge>
              )}
            </>
          }
        >
          <ReportCollection
            queryParams={reportsSearchQueryParams}
            setTotalCount={setNumReports}
            paginationKey="SEARCH_reports"
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS) && (
        <Fieldset
          id="authorizationGroups"
          title={
            <>
              Authorization Groups
              {hasAuthorizationGroupsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numAuthorizationGroups}
                </Badge>
              )}
            </>
          }
        >
          <AuthorizationGroups
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumAuthorizationGroups}
            paginationKey="SEARCH_authorizationGroups"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS, r)}
          />
        </Fieldset>
      )}
      {renderSaveModal()}
    </div>
  )

  function renderSaveModal() {
    return (
      <Modal centered show={showSaveSearch} onHide={closeSaveModal}>
        <Modal.Header closeButton>
          <Modal.Title>Save search</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Formik
            enableReinitialize
            onSubmit={onSubmitSaveSearch}
            initialValues={{ name: "" }}
          >
            {({ values, submitForm }) => (
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
                      variant="primary"
                      onClick={submitForm}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }

  function getPrepareEmailButtonProps() {
    if (hasRecipients()) {
      return {
        disabled: false,
        text: "Create email",
        href: createMailtoLink(),
        tooltip:
          "Click this button to start creating an email to the selected recipients",
        variant: "primary"
      }
    } else {
      return {
        disabled: true,
        text: "Select some recipients",
        tooltip: "Select some recipients to be able to create an email",
        variant: "outline-danger"
      }
    }
  }

  function createMailtoLink() {
    const emailAddresses = new Set()
    Object.values(recipients).forEach(m =>
      m?.forEach(v =>
        v?.forEach(e => emailAddresses.add(encodeURIComponent(e.address)))
      )
    )
    const mailtoLink = [...emailAddresses.values()].join(",")
    return `mailto:${mailtoLink}`
  }

  function hasRecipients() {
    return Object.values(recipients).some(r => !!r.size)
  }

  function updateRecipients(objectType, newRecipients) {
    recipients[objectType] = newRecipients
    setRecipients({ ...recipients })
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
