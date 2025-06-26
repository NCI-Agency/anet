import { SEARCH_OBJECT_TYPES } from "actions"
import AttachmentTable from "components/Attachment/AttachmentTable"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import EventTable from "components/EventTable"
import LocationTable from "components/LocationTable"
import OrganizationTable from "components/OrganizationTable"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import PersonTable from "components/PersonTable"
import PositionTable from "components/PositionTable"
import ReportCollection from "components/ReportCollection"
import TaskTable from "components/TaskTable"
import React, { useMemo } from "react"
import utils from "utils"

const DEFAULT_PAGESIZE = 10

const SEARCH_COMPONENTS = {
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: OrganizationTable,
  [SEARCH_OBJECT_TYPES.PEOPLE]: PersonTable,
  [SEARCH_OBJECT_TYPES.POSITIONS]: PositionTable,
  [SEARCH_OBJECT_TYPES.TASKS]: TaskTable,
  [SEARCH_OBJECT_TYPES.LOCATIONS]: LocationTable,
  [SEARCH_OBJECT_TYPES.REPORTS]: ReportCollection,
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: AuthorizationGroupTable,
  [SEARCH_OBJECT_TYPES.ATTACHMENTS]: AttachmentTable,
  [SEARCH_OBJECT_TYPES.EVENTS]: EventTable
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
  const TableComponent = SEARCH_COMPONENTS[type]
  if (!TableComponent) {
    return null
  }

  let gql, varName
  switch (type) {
    case SEARCH_OBJECT_TYPES.ORGANIZATIONS:
      varName = "organizationQuery"
      break
    case SEARCH_OBJECT_TYPES.PEOPLE:
      varName = "personQuery"
      break
    case SEARCH_OBJECT_TYPES.POSITIONS:
      varName = "positionQuery"
      break
    case SEARCH_OBJECT_TYPES.TASKS:
      varName = "taskQuery"
      break
    case SEARCH_OBJECT_TYPES.LOCATIONS:
      varName = "locationQuery"
      break
    case SEARCH_OBJECT_TYPES.REPORTS:
      varName = "reportQuery"
      break
    case SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS:
      varName = "authorizationGroupQuery"
      break
    case SEARCH_OBJECT_TYPES.ATTACHMENTS:
      varName = "attachmentQuery"
      break
    case SEARCH_OBJECT_TYPES.EVENTS:
      varName = "eventQuery"
      break
    default:
      return null
  }

  const queryParams = utils.parseJsonSafe(searchQuery)
  queryParams.pageSize = DEFAULT_PAGESIZE

  return (
    <div className="mb-4">
      <h6 className="mb-2">
        {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
      </h6>

      <TableComponent queryParams={queryParams} />
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
