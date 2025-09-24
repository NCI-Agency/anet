import { AggregationWidgetPropType } from "components/aggregations/utils"
import Leaflet, { ICON_TYPES, MarkerPopupProps } from "components/Leaflet"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import { Location, Report } from "models"
import moment from "moment"
import React, { useMemo, useState } from "react"
import { createPortal } from "react-dom"

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
  const [markerPopup, setMarkerPopup] = useState<MarkerPopupProps>({})
  const markers = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    values.forEach(report => {
      if (Location.hasCoordinates(report.location)) {
        markerArray.push({
          id: report.uuid,
          icon: getIcon(report),
          lat: report.location.lat,
          lng: report.location.lng,
          contents: report
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
        setMarkerPopup={setMarkerPopup}
        width={width}
        height={height}
        mapId={widgetId}
        marginBottom={0}
      />
      {markerPopup.container &&
        createPortal(
          renderMarkerPopupContents(markerPopup.contents),
          markerPopup.container
        )}
    </div>
  )

  function renderMarkerPopupContents(report) {
    return (
      <>
        <b>Report:</b> <LinkTo modelType="Report" model={report} />
        <br />
        <b>Location:</b>{" "}
        <LinkTo
          modelType="Location"
          model={{ uuid: report?.location?.uuid, name: report?.location?.name }}
        />
        {report.engagementDate && (
          <>
            <br />
            <b>Date:</b>{" "}
            {moment(report.engagementDate).format(
              Report.getEngagementDateFormat()
            )}
          </>
        )}
      </>
    )
  }
}

export default ReportsMapWidget
