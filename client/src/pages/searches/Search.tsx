import {
  gqlPreferenceFields,
  gqlSavedSearchFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  SEARCH_OBJECT_LABELS,
  SEARCH_OBJECT_TYPES,
  setPagination
} from "actions"
import API from "api"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { AnchorNavItem } from "components/Nav"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { CATEGORY_EXPORT } from "components/preferences/PreferencesFieldSet"
import UserPreferences from "components/preferences/UserPreferences"
import ReportCollection from "components/ReportCollection"
import AttachmentSearchResults from "components/search/AttachmentSearchResults"
import AuthorizationGroupSearchResults from "components/search/AuthorizationGroupSearchResults"
import EventSearchResults from "components/search/EventSearchResults"
import LocationSearchResults from "components/search/LocationSearchResults"
import OrganizationSearchResults from "components/search/OrganizationSearchResults"
import PeopleSearchResults from "components/search/PeopleSearchResults"
import PositionSearchResults from "components/search/PositionSearchResults"
import TaskSearchResults from "components/search/TaskSearchResults"
import {
  getSearchQuery,
  SearchDescription,
  SearchQueryPropType
} from "components/SearchFilters"
import SubNav from "components/SubNav"
import { exportResults } from "exportUtils"
import { Field, Form, Formik } from "formik"
import _isEqual from "lodash/isEqual"
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
import COMMUNITIES_ICON from "resources/communities.png"
import DOWNLOAD_ICON from "resources/download.png"
import EVENTS_ICON from "resources/events.png"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"

// By default limit exports to the first 1000 results
const MAX_NR_OF_EXPORTS = 1000
export const UNLIMITED_EXPORTS_COMMUNITY = "UNLIMITED_EXPORTS_COMMUNITY"

const GQL_GET_PREFERENCES = gql`
  query {
    preferences {
      ${gqlPreferenceFields}
    }
  }
`
const GQL_CREATE_SAVED_SEARCH = gql`
  mutation ($savedSearch: SavedSearchInput!) {
    createSavedSearch(savedSearch: $savedSearch) {
      uuid
    }
  }
`

const GQL_GET_SAVED_SEARCHES = gql`
  query {
    savedSearches: mySearches {
      ${gqlSavedSearchFields}
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 10
const SEARCH_ITEMS = {
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: {
    navTo: "organizations",
    iconImg: ORGANIZATIONS_ICON,
    searchResultsComponent: OrganizationSearchResults
  },
  [SEARCH_OBJECT_TYPES.PEOPLE]: {
    navTo: "people",
    iconImg: PEOPLE_ICON,
    searchResultsComponent: PeopleSearchResults
  },
  [SEARCH_OBJECT_TYPES.POSITIONS]: {
    navTo: "positions",
    iconImg: POSITIONS_ICON,
    searchResultsComponent: PositionSearchResults
  },
  [SEARCH_OBJECT_TYPES.TASKS]: {
    navTo: "tasks",
    iconImg: TASKS_ICON,
    searchResultsComponent: TaskSearchResults
  },
  [SEARCH_OBJECT_TYPES.LOCATIONS]: {
    navTo: "locations",
    iconImg: LOCATIONS_ICON,
    searchResultsComponent: LocationSearchResults
  },
  [SEARCH_OBJECT_TYPES.REPORTS]: {
    navTo: "reports",
    iconImg: REPORTS_ICON,
    searchResultsComponent: ReportCollection
  },
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: {
    navTo: "authorizationGroups",
    iconImg: COMMUNITIES_ICON,
    searchResultsComponent: AuthorizationGroupSearchResults
  },
  [SEARCH_OBJECT_TYPES.ATTACHMENTS]: {
    navTo: "attachments",
    iconName: IconNames.PAPERCLIP,
    searchResultsComponent: AttachmentSearchResults
  },
  [SEARCH_OBJECT_TYPES.EVENTS]: {
    navTo: "events",
    iconImg: EVENTS_ICON,
    searchResultsComponent: EventSearchResults
  }
}

const sum = (...args) => {
  return args.reduce((prev, curr) => (curr === null ? prev : prev + curr), null)
}

const resetNumResults = (
  searchQueryParamsChanged: boolean,
  queryTypesChanged: boolean,
  queryTypes: string[],
  queryType: string,
  setNumResults: (numResults: number) => void
) => {
  if (
    searchQueryParamsChanged ||
    (queryTypesChanged && !queryTypes.includes(queryType))
  ) {
    setNumResults(0)
  }
}

const DEFAULT_RECIPIENTS = {
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: new Map(),
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: new Map(),
  [SEARCH_OBJECT_TYPES.PEOPLE]: new Map(),
  [SEARCH_OBJECT_TYPES.POSITIONS]: new Map()
}

const resetRecipients = (
  searchQueryParamsChanged: boolean,
  queryTypesChanged: boolean,
  queryTypes: string[],
  recipients: object,
  setRecipients: (recipients: object) => void
) => {
  const newRecipients = Object.entries(DEFAULT_RECIPIENTS).reduce(
    (accum, [queryType, defaultRecipients]) => {
      if (
        searchQueryParamsChanged ||
        (queryTypesChanged && !queryTypes.includes(queryType))
      ) {
        accum[queryType] = defaultRecipients
      }
      return accum
    },
    { ...recipients }
  )
  setRecipients(newRecipients)
}

const hasResults = (
  queryTypes: string[],
  queryType: string,
  numResults: number
) => queryTypes.includes(queryType) && numResults > 0

interface SearchProps {
  pageDispatchers?: PageDispatchersPropType
  pagination: any
  setPagination: (...args: unknown[]) => unknown
  searchQuery?: SearchQueryPropType
}

const Search = ({
  pageDispatchers,
  searchQuery,
  pagination,
  setPagination
}: SearchProps) => {
  const { currentUser, appSettings } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [showSaveSearch, setShowSaveSearch] = useState(false)
  const [showExportResults, setShowExportResults] = useState(false)
  const [numOrganizations, setNumOrganizations] = useState(null)
  const [numPeople, setNumPeople] = useState(null)
  const [numPositions, setNumPositions] = useState(null)
  const [numTasks, setNumTasks] = useState(null)
  const [numLocations, setNumLocations] = useState(null)
  const [numReports, setNumReports] = useState(null)
  const [numAuthorizationGroups, setNumAuthorizationGroups] = useState(null)
  const [numAttachments, setNumAttachments] = useState(null)
  const [numEvents, setNumEvents] = useState(null)
  const setNumResults = useMemo(
    () => ({
      [SEARCH_OBJECT_TYPES.ATTACHMENTS]: setNumAttachments,
      [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: setNumAuthorizationGroups,
      [SEARCH_OBJECT_TYPES.EVENTS]: setNumEvents,
      [SEARCH_OBJECT_TYPES.LOCATIONS]: setNumLocations,
      [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: setNumOrganizations,
      [SEARCH_OBJECT_TYPES.PEOPLE]: setNumPeople,
      [SEARCH_OBJECT_TYPES.POSITIONS]: setNumPositions,
      [SEARCH_OBJECT_TYPES.REPORTS]: setNumReports,
      [SEARCH_OBJECT_TYPES.TASKS]: setNumTasks
    }),
    []
  )
  const [recipients, setRecipients] = useState({ ...DEFAULT_RECIPIENTS })
  const {
    loading,
    error: err,
    data,
    refetch
  } = API.useApiQuery(GQL_GET_SAVED_SEARCHES)
  const { done, result } = useBoilerplate({
    loading,
    error: err,
    pageDispatchers
  })
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
    numReports,
    numAttachments,
    numEvents
  )
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
  const attachmentSearchQueryParams = useMemo(
    () => ({
      ...searchQueryParams,
      pageSize,
      sortBy: "CREATED_AT",
      sortOrder: "DESC"
    }),
    [searchQueryParams, pageSize]
  )
  const reportsSearchQueryParams = useMemo(
    () => ({
      ...searchQueryParams,
      pageSize,
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC"
    }),
    [searchQueryParams, pageSize]
  )
  const getSearchQueryParams = (queryType: string) => {
    switch (queryType) {
      case SEARCH_OBJECT_TYPES.ATTACHMENTS:
        return attachmentSearchQueryParams
      case SEARCH_OBJECT_TYPES.REPORTS:
        return reportsSearchQueryParams
      default:
        return genericSearchQueryParams
    }
  }

  const exportMaxResults = currentUser?.authorizationGroups
    ?.map(ag => ag.uuid)
    ?.includes(appSettings[UNLIMITED_EXPORTS_COMMUNITY])
    ? 0
    : MAX_NR_OF_EXPORTS

  const queryTypes = useMemo(
    () =>
      searchQuery.objectType
        ? [searchQuery.objectType]
        : Object.keys(SEARCH_OBJECT_TYPES),
    [searchQuery.objectType]
  )
  const latestQueryTypes = useRef(queryTypes)
  const queryTypesChanged = !_isEqual(latestQueryTypes.current, queryTypes)
  const latestSearchQueryParams = useRef(searchQueryParams)
  const searchQueryParamsChanged = !_isEqual(
    latestSearchQueryParams.current,
    searchQueryParams
  )
  useEffect(() => {
    if (searchQueryParamsChanged || queryTypesChanged) {
      resetRecipients(
        searchQueryParamsChanged,
        queryTypesChanged,
        queryTypes,
        recipients,
        setRecipients
      )
      for (const queryType in setNumResults) {
        resetNumResults(
          searchQueryParamsChanged,
          queryTypesChanged,
          queryTypes,
          queryType,
          setNumResults[queryType]
        )
      }
      latestQueryTypes.current = queryTypes
      latestSearchQueryParams.current = searchQueryParams
    }
  }, [
    searchQueryParamsChanged,
    searchQueryParams,
    queryTypesChanged,
    queryTypes,
    recipients,
    setRecipients,
    setNumResults
  ])

  const allResults = useMemo(
    () => ({
      [SEARCH_OBJECT_TYPES.ATTACHMENTS]: numAttachments,
      [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: numAuthorizationGroups,
      [SEARCH_OBJECT_TYPES.EVENTS]: numEvents,
      [SEARCH_OBJECT_TYPES.LOCATIONS]: numLocations,
      [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: numOrganizations,
      [SEARCH_OBJECT_TYPES.PEOPLE]: numPeople,
      [SEARCH_OBJECT_TYPES.POSITIONS]: numPositions,
      [SEARCH_OBJECT_TYPES.REPORTS]: numReports,
      [SEARCH_OBJECT_TYPES.TASKS]: numTasks
    }),
    [
      numAttachments,
      numAuthorizationGroups,
      numEvents,
      numLocations,
      numOrganizations,
      numPeople,
      numPositions,
      numReports,
      numTasks
    ]
  )
  const hasObjectResults = useMemo(() => {
    return Object.entries(allResults).reduce(
      (accum, [queryType, numResults]) => {
        accum[queryType] = hasResults(queryTypes, queryType, numResults)
        return accum
      },
      {}
    )
  }, [allResults, queryTypes])

  const resultObjectTypes = useMemo(
    () =>
      Object.entries(hasObjectResults)
        .filter(([, b]) => b)
        .map(([queryType]) => queryType),
    [hasObjectResults]
  )

  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  const prepareEmailButtonProps = getPrepareEmailButtonProps()

  if (done) {
    return result
  }

  const savedSearches = (data?.savedSearches ?? []).map(s => ({
    objectType: s.objectType,
    query: utils.parseJsonSafe(s.query)
  }))

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
              {Object.entries(SEARCH_ITEMS).map(([queryType, searchItem]) => (
                <AnchorNavItem
                  key={queryType}
                  to={searchItem.navTo}
                  disabled={!hasObjectResults[queryType]}
                >
                  {searchItem.iconImg ? (
                    <img src={searchItem.iconImg} alt="" />
                  ) : (
                    <Icon icon={searchItem.iconName} />
                  )}
                  {` ${SEARCH_OBJECT_LABELS[queryType]}`}
                  {hasObjectResults[queryType] && (
                    <Badge pill bg="secondary" className="float-end ms-1">
                      {allResults[queryType]}
                    </Badge>
                  )}
                </AnchorNavItem>
              ))}
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
                <Dropdown.Item onClick={openExportResultsModal}>
                  Excel (xlsx)
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => exportSearchResults("kml", "application/xml")}
                >
                  Google Earth (kml)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </>
        )}
        <span className="ms-2">
          <Button
            onClick={openSaveModal}
            id="saveSearchButton"
            variant="outline-secondary"
          >
            Save search
          </Button>
        </span>
        {numResults > 0 && (
          <div className="ms-2">
            Results per page:
            <FormSelect
              defaultValue={pageSize}
              onChange={e =>
                setPageSize(parseInt(e.target.value, 10) || DEFAULT_PAGESIZE)
              }
            >
              {PAGESIZES.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
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
      {Object.entries(SEARCH_ITEMS).map(([queryType, searchItem]) => {
        if (!queryTypes.includes(queryType)) {
          return null
        }
        const SearchResultsComponent = searchItem.searchResultsComponent
        return (
          <Fieldset
            key={queryType}
            id={searchItem.navTo}
            title={
              <>
                {SEARCH_OBJECT_LABELS[queryType]}
                {hasObjectResults[queryType] && (
                  <Badge pill bg="secondary" className="ms-1">
                    {allResults[queryType]}
                  </Badge>
                )}
              </>
            }
          >
            <SearchResultsComponent
              pageDispatchers={pageDispatchers}
              queryParams={getSearchQueryParams(queryType)}
              setTotalCount={setNumResults[queryType]}
              paginationKey={`SEARCH_${searchItem.navTo}`}
              pagination={pagination}
              setPagination={setPagination}
              allowSelection={withEmail}
              updateRecipients={r => updateRecipients(queryType, r)}
            />
          </Fieldset>
        )
      })}
      {renderSaveModal()}
      {renderExportModal()}
    </div>
  )

  function renderSaveModal() {
    return (
      <Modal
        backdrop="static"
        centered
        show={showSaveSearch}
        onHide={closeSaveModal}
      >
        <Modal.Header closeButton>
          <Modal.Title>Save search</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Formik
            enableReinitialize
            onSubmit={onSubmitSaveSearch}
            initialValues={{ name: "", displayInHomepage: false }}
          >
            {({ submitForm }) => (
              <Form className="d-flex flex-column gap-3">
                <Field
                  name="name"
                  component={FieldHelper.InputField}
                  placeholder="Give this saved search a name (optional)"
                  vertical
                />
                <div className="form-check">
                  <Field
                    name="displayInHomepage"
                    type="checkbox"
                    className="form-check-input"
                    id="displayInHomepageCheckbox"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="displayInHomepageCheckbox"
                  >
                    Display in homepage
                  </label>
                </div>

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

  function renderExportModal() {
    return (
      <Modal
        backdrop="static"
        centered
        show={showExportResults}
        onHide={closeExportResultsModal}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Export Search Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserPreferences
            actionLabel="Save and Export"
            category={CATEGORY_EXPORT}
            title="My Export Preferences"
            actionOnSubmit={exportResultsFromModal}
            exportObjectTypes={resultObjectTypes}
          />
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function onSubmitSaveSearchSuccess(response, values, form) {
    if (response.createSavedSearch.uuid) {
      toast.success("Search saved")
      setError(null)
      setShowSaveSearch(false)
      refetch()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function saveSearch(values, form) {
    const savedSearch = {
      name: values.name,
      displayInHomepage: values.displayInHomepage,
      query: JSON.stringify(getSearchQuery(searchQuery))
    }
    if (searchQuery.objectType) {
      savedSearch.objectType = SEARCH_OBJECT_TYPES[searchQuery.objectType]
    }
    return API.mutation(GQL_CREATE_SAVED_SEARCH, { savedSearch })
  }

  function openSaveModal() {
    const parsedSearch = {
      objectType: SEARCH_OBJECT_TYPES[searchQuery.objectType] ?? null,
      query: getSearchQuery(searchQuery)
    }
    const isDuplicate = savedSearches.some(s =>
      utils.isDeeplyEqual(s, parsedSearch)
    )
    if (isDuplicate) {
      toast.info("There's already an identical saved search")
    } else {
      setShowSaveSearch(true)
    }
  }

  function closeSaveModal() {
    setShowSaveSearch(false)
  }

  function openExportResultsModal() {
    setShowExportResults(true)
  }

  async function exportResultsFromModal() {
    exportSearchResults(
      "xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    setShowExportResults(false)
  }

  function closeExportResultsModal() {
    setShowExportResults(false)
  }

  async function exportSearchResults(exportType, contentType) {
    // Get generic preferences that exportResults needs to decide on which columns to include
    const genericPreferences = await API.query(GQL_GET_PREFERENCES, {})
    await exportResults(
      genericPreferences.preferences,
      currentUser.preferences,
      searchQueryParams,
      resultObjectTypes,
      exportType,
      contentType,
      exportMaxResults,
      setError
    )
  }
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
  searchQuery: state.searchQuery,
  pagination: state.pagination
})

export default connect(mapStateToProps, mapDispatchToProps)(Search)
