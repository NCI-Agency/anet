import { SEARCH_OBJECT_LABELS, SEARCH_OBJECT_TYPES } from "actions"
import { PageDispatchersPropType } from "components/Page"
import ReportCollection from "components/ReportCollection"
import AttachmentSearchResults from "components/search/AttachmentSearchResults"
import AuthorizationGroupSearchResults from "components/search/AuthorizationGroupSearchResults"
import EventSearchResults from "components/search/EventSearchResults"
import LocationSearchResults from "components/search/LocationSearchResults"
import OrganizationSearchResults from "components/search/OrganizationSearchResults"
import PeopleSearchResults from "components/search/PeopleSearchResults"
import PositionSearchResults from "components/search/PositionSearchResults"
import TaskSearchResults from "components/search/TaskSearchResults"
import React, { useMemo, useState } from "react"
import { Alert, Badge } from "react-bootstrap"
import utils from "utils"

const DEFAULT_PAGESIZE = 10

const SEARCH_COMPONENTS = {
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: OrganizationSearchResults,
  [SEARCH_OBJECT_TYPES.PEOPLE]: PeopleSearchResults,
  [SEARCH_OBJECT_TYPES.POSITIONS]: PositionSearchResults,
  [SEARCH_OBJECT_TYPES.TASKS]: TaskSearchResults,
  [SEARCH_OBJECT_TYPES.LOCATIONS]: LocationSearchResults,
  [SEARCH_OBJECT_TYPES.REPORTS]: ReportCollection,
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: AuthorizationGroupSearchResults,
  [SEARCH_OBJECT_TYPES.ATTACHMENTS]: AttachmentSearchResults,
  [SEARCH_OBJECT_TYPES.EVENTS]: EventSearchResults
}

interface SearchResultsSectionProps {
  type: string
  searchQuery: any
  pageDispatchers?: PageDispatchersPropType
}

const SearchResultsSection = ({
  type,
  searchQuery,
  pageDispatchers
}: SearchResultsSectionProps) => {
  const [totalCount, setTotalCount] = useState(0)
  const TableComponent = SEARCH_COMPONENTS[type]
  if (!TableComponent) {
    return null
  }

  const queryParams = utils.parseJsonSafe(searchQuery)
  queryParams.pageSize = DEFAULT_PAGESIZE

  return (
    <div className="mb-4">
      <h6 className="mb-2">
        {SEARCH_OBJECT_LABELS[type]}
        <Badge pill bg="secondary" className="ms-2">
          {totalCount}
        </Badge>
      </h6>
      <TableComponent
        pageDispatchers={pageDispatchers}
        queryParams={queryParams}
        setTotalCount={setTotalCount}
      />
    </div>
  )
}

interface SearchResultsProps {
  searchQuery: any
  objectType?: string
  pageDispatchers?: PageDispatchersPropType
}
const SearchResults = ({
  searchQuery,
  objectType,
  pageDispatchers
}: SearchResultsProps) => {
  const objectTypes = useMemo(
    () => (objectType ? [objectType] : Object.values(SEARCH_OBJECT_TYPES)),
    [objectType]
  )

  return (
    <div>
      {objectTypes.map(type => (
        <SearchResultsSection
          key={type}
          type={type}
          searchQuery={searchQuery}
          pageDispatchers={pageDispatchers}
        />
      ))}
    </div>
  )
}

export default SearchResults
