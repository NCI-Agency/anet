import API from "api"
import { gql } from "apollo-boost"
import Leaflet from "components/Leaflet"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import _escape from "lodash/escape"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useMemo } from "react"
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

const ReportMap = props => {
  const {
    queryParams,
    setTotalCount,
    mapId,
    width,
    height,
    marginBottom
  } = props
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  const markers = useMemo(() => {
    const reports = data ? data.reportList.list : []
    if (!reports.length) {
      return []
    }
    const markerArray = []
    reports.forEach(report => {
      if (Location.hasCoordinates(report.location)) {
        let label = _escape(report.intent || "<undefined>") // escape HTML in intent!
        label += `<br/>@ <b>${_escape(report.location.name)}</b>` // escape HTML in locationName!
        markerArray.push({
          id: report.uuid,
          lat: report.location.lat,
          lng: report.location.lng,
          name: label
        })
      }
    })
    return markerArray
  }, [data])
  if (done) {
    if (setTotalCount) {
      // Reset the total count
      setTotalCount(null)
    }
    return result
  }

  if (setTotalCount) {
    const { totalCount } = data.reportList
    setTotalCount(totalCount)
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
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  mapId: PropTypes.string, // pass this when you have more than one map on a page
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

export default connect(
  null,
  mapDispatchToProps
)(ReportMap)
