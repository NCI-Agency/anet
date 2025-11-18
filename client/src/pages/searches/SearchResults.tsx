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
import React, { useEffect, useMemo, useState } from "react"
import { Badge } from "react-bootstrap"

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
  pageDispatchers: PageDispatchersPropType
  objectType: string
  searchQuery: any
  isOnlySearchResult: boolean
  setObjectTypeResultCount: (...args: unknown[]) => unknown
  pageSize?: number
}

const SearchResultsSection = ({
  pageDispatchers,
  objectType,
  searchQuery,
  isOnlySearchResult,
  setObjectTypeResultCount,
  pageSize
}: SearchResultsSectionProps) => {
  const [totalCount, setTotalCount] = useState(0)
  const TableComponent = SEARCH_COMPONENTS[objectType]
  if (!TableComponent) {
    return null
  }

  const queryParams = {
    ...searchQuery,
    pageSize: pageSize ?? DEFAULT_PAGESIZE
  }

  const updateCount = count => {
    if (totalCount !== count) {
      setTotalCount(count)
      setObjectTypeResultCount(objectType, count)
    }
  }

  return (
    <div
      className="mb-4"
      style={{
        display: !isOnlySearchResult && totalCount === 0 ? "none" : undefined
      }}
    >
      {!isOnlySearchResult && (
        <h6 className="mb-2">
          {SEARCH_OBJECT_LABELS[objectType]}
          <Badge pill bg="secondary" className="ms-2">
            {totalCount}
          </Badge>
        </h6>
      )}
      <TableComponent
        pageDispatchers={pageDispatchers}
        queryParams={queryParams}
        setTotalCount={updateCount}
      />
    </div>
  )
}

interface SearchResultsProps {
  pageDispatchers?: PageDispatchersPropType
  searchQuery: any
  objectType?: string
  setSearchCount: (...args: unknown[]) => unknown
  pageSize?: number
}
const SearchResults = ({
  pageDispatchers,
  searchQuery,
  objectType,
  setSearchCount,
  pageSize
}: SearchResultsProps) => {
  const [objectTypeResultCount, setObjectTypeResultCount] = useState({})
  const objectTypes = useMemo(
    () => (objectType ? [objectType] : Object.values(SEARCH_OBJECT_TYPES)),
    [objectType]
  )

  useEffect(() => {
    const searchCount = Object.values(objectTypeResultCount).reduce(
      (sum: number, count: number) => sum + count,
      0
    )
    setSearchCount(searchCount)
  }, [objectTypeResultCount, setSearchCount])

  return (
    <div>
      {objectTypes.map(type => (
        <SearchResultsSection
          key={type}
          pageDispatchers={pageDispatchers}
          objectType={type}
          searchQuery={searchQuery}
          isOnlySearchResult={!!objectType?.length}
          setObjectTypeResultCount={(objType: string, count: number) =>
            setObjectTypeResultCount(prev => ({ ...prev, [objType]: count }))
          }
          pageSize={pageSize}
        />
      ))}
    </div>
  )
}

export default SearchResults
