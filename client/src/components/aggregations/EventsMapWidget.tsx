import { AggregationWidgetPropType } from "components/aggregations/utils"
import Leaflet, { ICON_TYPES } from "components/Leaflet"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import React, { useMemo } from "react"

interface EventsMapWidgetProps extends AggregationWidgetPropType {
  width?: number
  height?: number
}

const EventsMapWidget = ({
  values = [],
  widgetId,
  width,
  height,
  whenUnspecified = null,
  ...otherWidgetProps // eslint-disable-line @typescript-eslint/no-unused-vars
}: EventsMapWidgetProps) => {
  const markers = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    values.forEach(event => {
      if (Location.hasCoordinates(event.location)) {
        let label = _escape(event.name || "<undefined>") // escape HTML in intent!
        label += `<br/>@ <b>${_escape(event.location.name)}</b>` // escape HTML in locationName!
        markerArray.push({
          id: event.uuid,
          icon: ICON_TYPES.GREEN,
          lat: event.location.lat,
          lng: event.location.lng,
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

export default EventsMapWidget
