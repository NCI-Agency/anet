import { gql } from "@apollo/client"
import API from "api"
import ReportsMapWidget from "components/aggregations/ReportsMapWidget"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { connect } from "react-redux"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
        state
        engagementDate
        location {
          uuid
          name
          lat
          lng
        }
      }
    }
  }
`

const ReportMap = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  mapId,
  width,
  height,
  marginBottom
}) => {
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.reportList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
  if (done) {
    return result
  }
  const reports = data ? data.reportList.list : []
  return (
    <ReportsMapWidget
      values={reports}
      widgetId={mapId}
      width={width}
      height={height}
      marginBottom={marginBottom}
      whenUnspecified={<em>No reports with a location found</em>}
    />
  )
}

ReportMap.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  // pass mapId explicitly when you have more than one map on a page (else the default is fine):
  mapId: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

ReportMap.defaultProps = {
  mapId: "reports"
}
export default connect(null, mapPageDispatchersToProps)(ReportMap)
