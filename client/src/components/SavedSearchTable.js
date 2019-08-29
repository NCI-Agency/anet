import { SEARCH_OBJECT_TYPES } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { useBoilerplate } from "components/Page"
import ReportCollection from "components/ReportCollection"
import PropTypes from "prop-types"
import React from "react"

const GQL_GET_REPORT_LIST = gql`
  query($query: ReportSearchQueryInput) {
    reports: reportList(query: $query) {
      pageNum
      pageSize
      totalCount
      list {
        ${ReportCollection.GQL_REPORT_FIELDS}
      }
    }
  }
`

const SavedSearchTable = props => {
  const objType =
    SEARCH_OBJECT_TYPES[props.search.objectType] || SEARCH_OBJECT_TYPES.REPORTS
  if (objType !== SEARCH_OBJECT_TYPES.REPORTS) {
    // This table only shows reports
    return <ReportCollection reports={[]} />
  }
  return <SavedSearchReportsTable {...props} />
}

SavedSearchTable.propTypes = {
  search: PropTypes.any.isRequired
}

const SavedSearchReportsTable = props => {
  let query = JSON.parse(props.search.query)
  // Add default sorting (if not specified/saved in the query); see SEARCH_CONFIG in pages/Search.js
  query.sortBy = query.sortBy || "ENGAGEMENT_DATE"
  query.sortOrder = query.sortOrder || "DESC"
  query.pageNum = query.pageNum || 0
  query.pageSize = query.pageSize || 10
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    query
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const reports = data.reports

  return <ReportCollection reports={reports.list} />
}

SavedSearchReportsTable.propTypes = {
  search: PropTypes.any.isRequired
}

export default SavedSearchTable
