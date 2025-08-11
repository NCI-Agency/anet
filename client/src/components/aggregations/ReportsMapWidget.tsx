import { AggregationWidgetPropType } from "components/aggregations/utils"
import Leaflet, { ICON_TYPES } from "components/Leaflet"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import { Location, Report } from "models"
import moment from "moment"
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

interface ReportsMapWidgetProps extends AggregationWidgetPropType {
  width?: number | string
  height?: number | string
}

const ReportsMapWidget = ({
  values = [],
  widgetId,
  width,
  height,
  whenUnspecified = null,
  ...otherWidgetProps // eslint-disable-line @typescript-eslint/no-unused-vars
}: ReportsMapWidgetProps) => {
  const markers = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    values.forEach(report => {
      if (Location.hasCoordinates(report.location)) {
        let label = `<b>Report:</b> <a href="${Report.pathFor(report)}" target="_blank">${_escape(report.intent || "<undefined>")}</a>` // escape HTML in intent!
        label += `<br/><b>Location:</b> ${_escape(report.location.name)}` // escape HTML in locationName!
        if (report.engagementDate) {
          label += `<br/><b>Date:</b> ${moment(report.engagementDate).format(Report.getEngagementDateFormat())}`
        }
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

export default ReportsMapWidget
