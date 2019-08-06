import Leaflet from "components/Leaflet"
import _escape from "lodash/escape"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"

function Map(props) {
  const [reports, setReports] = useState(props.reports)

  useEffect(() => {
    setReports(props.reports)
  }, [props.reports])

  function getMarkers(reports) {
    if (!reports) {
      return []
    } else {
      let markers = []
      reports.forEach(report => {
        if (Location.hasCoordinates(report.location)) {
          let label = _escape(report.intent || "<undefined>") // escape HTML in intent!
          label += `<br/>@ <b>${_escape(report.location.name)}</b>` // escape HTML in locationName!
          markers.push({
            id: report.uuid,
            lat: report.location.lat,
            lng: report.location.lng,
            name: label
          })
        }
      })
      return markers
    }
  }

  function fetchReports(fetchInfo) {
    if (props.getReportsQuery) {
      props.getReportsQuery(fetchInfo).then(data => {
        for (var prop in data) {
          setReports(data[prop].list)
          break
        }
      })
    }
  }

  return (
    <Leaflet
      markers={getMarkers(reports)}
      updateCallback={props.getReportsQuery && fetchReports}
      mapId={props.mapId}
      width={props.width}
      height={props.height}
      marginBottom={props.marginBottom}
    />
  )
}

Map.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  reports: PropTypes.array,
  getReportsQuery: PropTypes.func,
  mapId: PropTypes.string
}

export default Map
