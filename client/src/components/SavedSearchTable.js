import { SEARCH_OBJECT_TYPES } from "actions"
import ReportCollection, {
  FORMAT_CALENDAR,
  FORMAT_MAP,
  FORMAT_STATISTICS,
  FORMAT_SUMMARY,
  FORMAT_TABLE
} from "components/ReportCollection"
import PropTypes from "prop-types"
import React from "react"
import utils from "utils"

const SavedSearchTable = props => {
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

  return (
    <ReportCollection
      paginationKey="r_saved-search"
      queryParams={query}
      viewFormats={[
        FORMAT_SUMMARY,
        FORMAT_TABLE,
        FORMAT_CALENDAR,
        FORMAT_MAP,
        FORMAT_STATISTICS
      ]}
    />
  )
}

SavedSearchTable.propTypes = {
  search: PropTypes.any.isRequired
}

export default SavedSearchTable
