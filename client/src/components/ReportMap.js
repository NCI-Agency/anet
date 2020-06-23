import { gql } from "@apollo/client"
import API from "api"
import Leaflet from "components/Leaflet"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PlanningConflictForReport from "components/PlanningConflictForReport"
import { Location } from "models"
import Report from "models/Report"
import PropTypes from "prop-types"
import React, { useEffect, useMemo } from "react"
import ReactDOM from "react-dom"
import { connect } from "react-redux"

const GQL_GET_REPORT_LIST = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
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
  const markers = useMemo(() => {
    return (data?.reportList?.list || [])
      .filter(report => Location.hasCoordinates(report.location))
      .map(report => ({
        id: report.uuid,
        lat: report.location.lat,
        lng: report.location.lng,
        name: `<div id="marker-cont-${report.uuid}" style="width: 300px;min-height: 80px"></div>`,
        popupOpen: () => {
          const el = document.getElementById(`marker-cont-${report.uuid}`)
          ReactDOM.render(
            <>
              <div>{report.intent || ""}</div>@ <b>{report.location.name}</b>
              <PlanningConflictForReport report={new Report(report)} />
            </>,
            el
          )
        }
      }))
  }, [data])
  // Update the total count
  const totalCount = done ? null : data?.reportList?.totalCount
  useEffect(() => setTotalCount && setTotalCount(totalCount), [
    setTotalCount,
    totalCount
  ])
  if (done) {
    return result
  }

  return (
    <Leaflet
      markers={markers}
      mapId={mapId}
      width={width}
      height={height}
      marginBottom={marginBottom}
    />
  )
}

ReportMap.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  mapId: PropTypes.string, // pass this when you have more than one map on a page
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

export default connect(null, mapPageDispatchersToProps)(ReportMap)
