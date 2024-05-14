import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import Leaflet, { ICON_TYPES } from "components/Leaflet"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import { Location, Report } from "models"
import PropTypes from "prop-types"
import React, { useMemo } from "react"

const getIcon = report => {
  if (report.state === Report.STATE.CANCELLED) {
    return ICON_TYPES.AMBER
  }
  if (Report.isFuture(report.engagementDate)) {
    return ICON_TYPES.BLUE
  }
  return ICON_TYPES.GREEN
}

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
          icon: getIcon(report),
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
