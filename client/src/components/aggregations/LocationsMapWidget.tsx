import { AggregationWidgetPropType } from "components/aggregations/utils"
import Leaflet, { ICON_TYPES, MarkerPopupProps } from "components/Leaflet"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import React, { useMemo, useState } from "react"
import { createPortal } from "react-dom"

interface LocationsMapWidgetProps extends AggregationWidgetPropType {
  width?: number | string
  height?: number | string
}

const LocationsMapWidget = ({
  values = [],
  widgetId,
  width,
  height,
  whenUnspecified = null,
  ...otherWidgetProps // eslint-disable-line @typescript-eslint/no-unused-vars
}: LocationsMapWidgetProps) => {
  const [markerPopup, setMarkerPopup] = useState<MarkerPopupProps>({})
  const [markers, shapes] = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    const shapesArray = []
    for (const location of values) {
      if (Location.hasCoordinates(location)) {
        markerArray.push({
          id: location.uuid,
          icon: ICON_TYPES.GREEN,
          lat: location.lat,
          lng: location.lng,
          contents: location
        })
      }

      if (location.geoJson) {
        shapesArray.push({ id: location.uuid, geoJson: location.geoJson })
      }
    }
    return [markerArray, shapesArray]
  }, [values])

  if (_isEmpty(markers) && _isEmpty(shapes)) {
    return whenUnspecified
  }

  return (
    <div className="non-scrollable">
      <Leaflet
        markers={markers}
        shapes={shapes}
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

  function renderMarkerPopupContents(location) {
    if (!location) {
      return null
    }
    return (
      <>
        <b>Location:</b> <LinkTo modelType="Location" model={location} />
      </>
    )
  }
}

export default LocationsMapWidget
