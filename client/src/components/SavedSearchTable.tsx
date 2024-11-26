import { SEARCH_OBJECT_TYPES } from "actions"
import ReportCollection from "components/ReportCollection"
import React from "react"
import utils from "utils"

interface SavedSearchTableProps {
  search: any
}

const SavedSearchTable = (props: SavedSearchTableProps) => {
  const objType =
    SEARCH_OBJECT_TYPES[props.search.objectType] || SEARCH_OBJECT_TYPES.REPORTS
  if (objType !== SEARCH_OBJECT_TYPES.REPORTS) {
    // This table only shows reports
    return <em>No reports found</em>
  }

  const query = utils.parseJsonSafe(props.search.query)
  // Add default sorting (if not specified/saved in the query); see SEARCH_CONFIG in pages/Search.js
  query.sortBy = query.sortBy || "ENGAGEMENT_DATE"
  query.sortOrder = query.sortOrder || "DESC"
  query.pageNum = query.pageNum || 0
  query.pageSize = query.pageSize || 10

  return <ReportCollection paginationKey="r_saved-search" queryParams={query} />
}

export default SavedSearchTable
