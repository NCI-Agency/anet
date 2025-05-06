import { SEARCH_OBJECT_TYPES } from "actions"
import LocationTable from "components/LocationTable"
import ReportCollection from "components/ReportCollection"
import React from "react"
import utils from "utils"

interface SavedSearchTableProps {
  search: any
}

const SavedSearchTable = (props: SavedSearchTableProps) => {
  const objType = SEARCH_OBJECT_TYPES[props.search.objectType]
  const query = utils.parseJsonSafe(props.search.query)

  if (objType === SEARCH_OBJECT_TYPES.REPORTS) {
    query.sortBy = query.sortBy || "ENGAGEMENT_DATE"
    query.sortOrder = query.sortOrder || "DESC"
    query.pageNum = query.pageNum || 0
    query.pageSize = query.pageSize || 10
    return (
      <ReportCollection paginationKey="r_saved-search" queryParams={query} />
    )
  } else if (objType === SEARCH_OBJECT_TYPES.LOCATIONS) {
    query.sortBy = query.sortBy || "NAME"
    query.sortOrder = query.sortOrder || "ASC"
    query.pageNum = query.pageNum || 0
    query.pageSize = query.pageSize || 10
    return <LocationTable paginationKey="l_saved-search" queryParams={query} />
  } else {
    return <em>Unsupported object type: {objType}</em>
  }
}

export default SavedSearchTable
