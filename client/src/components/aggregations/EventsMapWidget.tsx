import { AggregationWidgetPropType } from "components/aggregations/utils"
import Leaflet, { ICON_TYPES, MarkerPopupProps } from "components/Leaflet"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import React, { useMemo, useState } from "react"
import { createPortal } from "react-dom"

const getIcon = event => {
  return event.status === Model.STATUS.INACTIVE
    ? ICON_TYPES.AMBER
    : ICON_TYPES.GREEN
}

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
  const [markerPopup, setMarkerPopup] = useState<MarkerPopupProps>({})
  const markers = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    values.forEach(event => {
      if (Location.hasCoordinates(event.location)) {
        markerArray.push({
          id: event.uuid,
          icon: getIcon(event),
          lat: event.location.lat,
          lng: event.location.lng,
          contents: event
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

  function renderMarkerPopupContents(event) {
    return (
      <>
        <LinkTo modelType="Event" model={event} /> @{" "}
        <LinkTo modelType="Location" model={event?.location} />
      </>
    )
  }
}

export default EventsMapWidget
