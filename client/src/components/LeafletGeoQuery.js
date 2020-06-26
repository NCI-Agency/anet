import { Button, Intent } from "@blueprintjs/core"
import API from "api"
import { gql } from "apollo-boost"
import { Icon, Map, Marker } from "leaflet"
import { MarkerClusterGroup } from "leaflet.markercluster"
import Location from "models/Location"
import GeoLocation from "pages/locations/GeoLocation"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { toast } from "react-toastify"
import MARKER_ICON_2X from "resources/leaflet/marker-icon-2x-black.png"
import MARKER_ICON from "resources/leaflet/marker-icon-black.png"
import MARKER_SHADOW from "resources/leaflet/marker-shadow.png"

const GQL_NEARBY_LOCATIONS = gql`
  query($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      totalCount
      list {
        uuid
        name
        lat
        lng
      }
    }
  }
`
// TODO use icon from https://github.com/NCI-Agency/anet/pull/3056
const icon = new Icon({
  iconUrl: MARKER_ICON,
  iconRetinaUrl: MARKER_ICON_2X,
  shadowUrl: MARKER_SHADOW,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

function createWKTPolygon(bounds, mapCenter) {
  let result = "POLYGON (("
  result += bounds.getSouthWest().lng + " "
  result += bounds.getSouthWest().lat + ", " // bottom left
  result += mapCenter.lng + " "
  result += bounds.getSouth() + ", " // bottom center
  result += bounds.getSouthEast().lng + " "
  result += bounds.getSouthEast().lat + ", " // bottom right
  result += bounds.getEast() + " "
  result += mapCenter.lat + ", " // center right
  result += bounds.getNorthEast().lng + " "
  result += bounds.getNorthEast().lat + ", " // top right
  result += mapCenter.lng + " "
  result += bounds.getNorth() + ", " // top center
  result += bounds.getNorthWest().lng + " "
  result += bounds.getNorthWest().lat + ", " // top left
  result += bounds.getWest() + " "
  result += mapCenter.lat + ", " // center left
  result += bounds.getSouthWest().lng + " "
  result += bounds.getSouthWest().lat // bottom left (again)
  result += "))"
  return result
}

// TODO similar functionality also exists in https://github.com/NCI-Agency/anet/pull/3056
function getLayer(locations, exUuids) {
  const allMarkers = locations
    .filter(l => Location.hasCoordinates(l) && !exUuids.some(e => e === l.uuid))
    .map(location => {
      const popupContent = document.createElement("div")
      popupContent.setAttribute("style", "width: 300px;text-align: center")

      return new Marker([location.lat, location.lng], {
        icon: icon,
        draggable: false,
        autoPan: false,
        id: location.uuid
      })
        .bindPopup(popupContent)
        .on("popupopen", e => {
          // TODO LinkTo component will be utilized here to provide routing
          ReactDOM.render(
            <>
              <b>{location.name}</b> @{" "}
              <GeoLocation lat={location.lat} lng={location.lng} />
            </>,
            e.popup.getContent()
          )
        })
    })
  return new MarkerClusterGroup().addLayers(allMarkers)
}

const GeoQueryHandler = ({ map, curMarkerLayer, polygon, setLoading }) => {
  const activeLayer = useRef()

  useEffect(
    () => () => activeLayer.current && map.removeLayer(activeLayer.current),
    [map]
  )

  const { loading, error, data } = API.useApiQuery(GQL_NEARBY_LOCATIONS, {
    locationQuery: { pageSize: 0, withinPolygon: polygon }
  })

  useEffect(() => {
    setLoading(loading)
  }, [loading, setLoading])

  if (loading || error || !data?.locationList?.list?.length) {
    if (error) {
      toast.error("An error occured while fetching nearby locations!")
    }
    return null
  }

  if (activeLayer.current) {
    map.removeLayer(activeLayer.current)
  }

  const curMarkerUuids = (curMarkerLayer?.getLayers() || [])
    .map(_ => _?.options?.id)
    .filter(_ => !!_)

  activeLayer.current = getLayer(data.locationList.list, curMarkerUuids)
  map.addLayer(activeLayer.current)
  return null
}

GeoQueryHandler.propTypes = {
  map: PropTypes.instanceOf(Map).isRequired,
  curMarkerLayer: PropTypes.instanceOf(MarkerClusterGroup).isRequired,
  polygon: PropTypes.string.isRequired,
  setLoading: PropTypes.func.isRequired
}

const reportSearchBtnStyle = {
  zIndex: 900,
  position: "absolute",
  width: "200px",
  right: 0,
  bottom: 0,
  margin: "0 4px 4px 0"
}

const LeafletGeoQuery = ({ map, markerLayer, modelType }) => {
  const [showItems, setShowItems] = useState(false)
  const [loading, setLoading] = useState(false)
  const [polygon, setPolygon] = useState()
  const previousBounds = useRef()
  const evtHandler = useRef(event => {
    // TODO optimize this by creating a polygon which is a cumulative union
    // save the union polygon and use it whenever an inner polygon is queried
    // such that if the possible largest bounds is queried then there will be no
    // need for any subsequent queries.
    // requires seom geometry artihmetic, not sure if leaflet api is enough for this
    const currentBounds = event.target.getBounds()
    if (!previousBounds.current?.contains(currentBounds)) {
      const poly = createWKTPolygon(currentBounds.pad(0.5), map.getCenter())
      previousBounds.current = currentBounds.pad(0.5)
      setPolygon(poly)
    }
  })

  useEffect(() => {
    const handler = evtHandler.current
    map.on("moveend", handler)
    return () => map.off("moveend", handler)
  }, [map])

  if (modelType === "Report" || modelType === "Position") {
    // TODO
    console.warn(`LeafletGeoQuery is underconstruction for ${modelType}s.`)
    return null
  }

  return (
    <>
      {showItems && polygon && (
        <GeoQueryHandler
          map={map}
          curMarkerLayer={markerLayer}
          polygon={polygon}
          setLoading={setLoading}
        />
      )}
      <Button
        intent={Intent.PRIMARY}
        icon={showItems ? "eye-off" : "eye-open"}
        style={reportSearchBtnStyle}
        loading={loading}
        onClick={() => setShowItems(!showItems)}
      >
        {showItems ? "Hide" : "Show"} Nearby {modelType}s{" "}
      </Button>
    </>
  )
}

LeafletGeoQuery.propTypes = {
  map: PropTypes.instanceOf(Map).isRequired,
  markerLayer: PropTypes.instanceOf(MarkerClusterGroup).isRequired,
  modelType: PropTypes.oneOf(["Location", "Report", "Position"]).isRequired
}

export default LeafletGeoQuery
