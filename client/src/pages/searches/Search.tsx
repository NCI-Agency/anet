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
import MyPreferences from "pages/preferences/MyPreferences"
import pluralize from "pluralize"
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
import Settings from "settings"
import utils from "utils"

// By default limit exports to the first 1000 results
const MAX_NR_OF_EXPORTS = 1000
export const UNLIMITED_EXPORTS_COMMUNITY = "UNLIMITED_EXPORTS_COMMUNITY"

const GQL_GET_PREFERENCES = gql`
  query {
    preferences {
      uuid
      name
      type
      description
      defaultValue
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
      objectType
      query
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 10

const sum = (...args) => {
  return args.reduce((prev, curr) => (curr === null ? prev : prev + curr))
}

const DEFAULT_RECIPIENTS = {
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: new Map(),
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: new Map(),
  [SEARCH_OBJECT_TYPES.PEOPLE]: new Map(),
  [SEARCH_OBJECT_TYPES.POSITIONS]: new Map()
}

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
  const attachmentSearchQueryParams = useMemo(
    () => ({
      ...searchQueryParams,
      pageSize,
      sortBy: "CREATED_AT",
      sortOrder: "DESC"
    }),
    [searchQueryParams, pageSize]
  )
  const eventSearchQueryParams = useMemo(
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
      pageSize,
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC"
    }),
    [searchQueryParams, pageSize]
  )
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
  const latestQuery = useRef({ queryTypes, searchQueryParams })
  const queryUnchanged = _isEqual(latestQuery.current, {
    queryTypes,
    searchQueryParams
  })
  useEffect(() => {
    if (!queryUnchanged) {
      latestQuery.current = { queryTypes, searchQueryParams }
      setNumAttachments(0)
      setNumAuthorizationGroups(0)
      setNumEvents(0)
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
    setNumAttachments,
    setNumAuthorizationGroups,
    setNumEvents,
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
  const hasAttachmentsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.ATTACHMENTS) && numAttachments > 0
  const hasEventsResults =
    queryTypes.includes(SEARCH_OBJECT_TYPES.EVENTS) && numEvents > 0
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
                <img src={COMMUNITIES_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]}{" "}
                {hasAuthorizationGroupsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numAuthorizationGroups}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="attachments" disabled={!hasAttachmentsResults}>
                <Icon icon={IconNames.PAPERCLIP} />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.ATTACHMENTS]}{" "}
                {hasAttachmentsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numAttachments}
                  </Badge>
                )}
              </AnchorNavItem>

              <AnchorNavItem to="events" disabled={!hasEventsResults}>
                <img src={EVENTS_ICON} alt="" />{" "}
                {SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES.EVENTS]}{" "}
                {hasEventsResults && (
                  <Badge pill bg="secondary" className="float-end">
                    {numEvents}
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
                    exportSearchResults(
                      "xlsx",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
                  }
                >
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
            onClick={openExportResultsModal}
            id="openExportResultsButton"
            variant="outline-secondary"
          >
            Export preferences
          </Button>
        </span>
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
          <OrganizationSearchResults
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumOrganizations}
            paginationKey="SEARCH_organizations"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.ORGANIZATIONS, r)
            }
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
          <PeopleSearchResults
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumPeople}
            paginationKey="SEARCH_people"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.PEOPLE, r)
            }
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
          <PositionSearchResults
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumPositions}
            paginationKey="SEARCH_positions"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.POSITIONS, r)
            }
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
          <TaskSearchResults
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
          <LocationSearchResults
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
              Communities
              {hasAuthorizationGroupsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numAuthorizationGroups}
                </Badge>
              )}
            </>
          }
        >
          <AuthorizationGroupSearchResults
            pageDispatchers={pageDispatchers}
            queryParams={genericSearchQueryParams}
            setTotalCount={setNumAuthorizationGroups}
            paginationKey="SEARCH_authorizationGroups"
            pagination={pagination}
            setPagination={setPagination}
            allowSelection={withEmail}
            updateRecipients={r =>
              updateRecipients(SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS, r)
            }
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.ATTACHMENTS) && !withEmail && (
        <Fieldset
          id="attachments"
          title={
            <>
              Attachments
              {hasAttachmentsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numAttachments}
                </Badge>
              )}
            </>
          }
        >
          <AttachmentSearchResults
            pageDispatchers={pageDispatchers}
            queryParams={attachmentSearchQueryParams}
            setTotalCount={setNumAttachments}
            paginationKey="SEARCH_attachments"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {queryTypes.includes(SEARCH_OBJECT_TYPES.EVENTS) && !withEmail && (
        <Fieldset
          id="events"
          title={
            <>
              Events
              {hasEventsResults && (
                <Badge pill bg="secondary" className="ms-1">
                  {numEvents}
                </Badge>
              )}
            </>
          }
        >
          <EventSearchResults
            pageDispatchers={pageDispatchers}
            queryParams={eventSearchQueryParams}
            setTotalCount={setNumEvents}
            paginationKey="SEARCH_events"
            pagination={pagination}
            setPagination={setPagination}
          />
        </Fieldset>
      )}
      {renderSaveModal()}
      {renderExportModal()}
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
        centered
        show={showExportResults}
        onHide={closeExportResultsModal}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Export preferences</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <MyPreferences
            category="export"
            actionOnSubmit={closeExportResultsModal}
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
      queryTypes,
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
