import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import Leaflet from "components/Leaflet"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useMemo } from "react"

const ReportsMapWidget = ({
  values,
  widgetId,
  width,
  height,
  whenUnspecified,
  ...otherWidgetProps
}) => {
  const markers = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    values.forEach(report => {
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
  }, [values])
  if (_isEmpty(markers)) {
    return whenUnspecified
  }
  return (
    <div className="non-scrollable">
      <Leaflet
        markers={markers}
        width={width}
        height={height}
        mapId={widgetId}
        marginBottom={0}
      />
    </div>
  )
}
ReportsMapWidget.propTypes = {
  ...aggregationWidgetPropTypes,
  width: PropTypes.number,
  height: PropTypes.number
}
ReportsMapWidget.defaultProps = {
  values: [],
  ...aggregationWidgetDefaultProps
}

export default ReportsMapWidget
