import { SEARCH_OBJECT_TYPES } from "actions"
import LocationTable from "components/LocationTable"
import ReportCollection from "components/ReportCollection"
import React from "react"
import utils from "utils"
import PersonTable from "./PersonTable"

interface SavedSearchTableProps {
  search: any
}

const SavedSearchTable = (props: SavedSearchTableProps) => {
  const objType = SEARCH_OBJECT_TYPES[props.search.objectType]
  const query = utils.parseJsonSafe(props.search.query)
  query.pageNum = query.pageNum || 0
  query.pageSize = query.pageSize || 10

  if (objType === SEARCH_OBJECT_TYPES.REPORTS) {
    query.sortBy = query.sortBy || "ENGAGEMENT_DATE"
    query.sortOrder = query.sortOrder || "DESC"
    return (
      <ReportCollection paginationKey="r_saved-search" queryParams={query} />
    )
  } else if (objType === SEARCH_OBJECT_TYPES.LOCATIONS) {
    query.sortBy = query.sortBy || "NAME"
    query.sortOrder = query.sortOrder || "ASC"
    return <LocationTable paginationKey="l_saved-search" queryParams={query} />
  } else if (objType === SEARCH_OBJECT_TYPES.PEOPLE) {
    query.sortBy = query.sortBy || "NAME"
    query.sortOrder = query.sortOrder || "ASC"
    return <LocationTable paginationKey="p_saved-search" queryParams={query} />
  } else {
    return <em>Unsupported object type: {objType}</em>
  }
}

export default SavedSearchTable
