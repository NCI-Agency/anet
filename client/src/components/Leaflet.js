import AppContext from "components/AppContext"
import { convertLatLngToMGRS } from "geoUtils"
import { Control, CRS, DivIcon, Icon, Map, Marker, TileLayer } from "leaflet"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css"
import {
  EsriProvider,
  GeoSearchControl,
  OpenStreetMapProvider
} from "leaflet-geosearch"
import "leaflet-geosearch/assets/css/leaflet.css"
import { GestureHandling } from "leaflet-gesture-handling"
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css"
import { MarkerClusterGroup } from "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet/dist/leaflet.css"
import { Location } from "models"
import GeoLocation from "pages/locations/GeoLocation"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import MARKER_FLAG_BLUE_2X from "resources/leaflet/marker-flag-blue-2x.png"
import MARKER_FLAG_BLUE from "resources/leaflet/marker-flag-blue.png"
import MARKER_ICON_2X from "resources/leaflet/marker-icon-2x.png"
import MARKER_ICON from "resources/leaflet/marker-icon.png"
import MARKER_SHADOW from "resources/leaflet/marker-shadow.png"
import Settings from "settings"

const css = {
  zIndex: 1
}

class CustomUrlEsriProvider extends EsriProvider {
  constructor(searchUrl, options = {}) {
    super(options)
    if (searchUrl) {
      if (searchUrl.startsWith("http://") || searchUrl.startsWith("https://")) {
        this.searchUrl = searchUrl
      } else {
        this.searchUrl = "https://" + searchUrl
      }
    }
  }
}

const geoSearcherProviders = {
  ESRI: () => {
    return new CustomUrlEsriProvider(Settings.imagery.geoSearcher.url, {
      params: { maxLocations: 5 }
    })
  },
  OSM: () => {
    return new OpenStreetMapProvider()
  }
}

const searchProvider =
  Settings.imagery.geoSearcher &&
  geoSearcherProviders[Settings.imagery.geoSearcher.provider]()

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

const locationIcon = new Icon({
  iconUrl: MARKER_FLAG_BLUE,
  iconRetinaUrl: MARKER_FLAG_BLUE_2X,
  iconSize: [64, 64],
  iconAnchor: [18, 62],
  popupAnchor: [2, -58]
})

const addLayers = (map, layerControl) => {
  let defaultLayer = null
  Settings.imagery.baseLayers.forEach(layerConfig => {
    let layer = null
    if (layerConfig.type === "wms") {
      layer = new TileLayer.WMS(layerConfig.url, layerConfig.options)
    } else if (layerConfig.type === "osm" || layerConfig.type === "tile") {
      layer = new TileLayer(layerConfig.url, layerConfig.options)
    }
    if (layer) {
      layerControl.addBaseLayer(layer, layerConfig.name)
    }
    if (layerConfig.default) {
      defaultLayer = layer
    }
  })
  if (defaultLayer) {
    map.addLayer(defaultLayer)
  }
}

const BaseLeaflet = ({
  width,
  height,
  marginBottom,
  markers,
  allLocations,
  mapId: initialMapId,
  onMapClick
}) => {
  const mapId = "map-" + (initialMapId || "default")
  const style = Object.assign({}, css, {
    width: width,
    height: height,
    marginBottom: marginBottom
  })

  const latestWidth = useRef(width)
  const widthPropUnchanged = latestWidth.current === width

  const latestHeight = useRef(height)
  const heightPropUnchanged = latestHeight.current === height

  const [map, setMap] = useState(null)
  const [markerLayer, setMarkerLayer] = useState(null)
  const [layerControl, setLayerControl] = useState(null)
  const [doInitializeMarkerLayer, setDoInitializeMarkerLayer] = useState(false)
  const prevMarkersRef = useRef()

  const updateMarkerLayer = useCallback(
    (newMarkers = [], maxZoom = 15) => {
      newMarkers.forEach(m => {
        const latLng = Location.hasCoordinates(m)
          ? [m.lat, m.lng]
          : map.getCenter()
        const marker = new Marker(latLng, {
          icon: icon,
          draggable: m.draggable || false,
          autoPan: m.autoPan || false,
          id: m.id,
          zIndexOffset: 1000
        })
        if (m.name) {
          marker.bindPopup(m.name)
        }
        if (m.onMove) {
          marker.on("moveend", event => m.onMove(event, map))
        }
        markerLayer.addLayer(marker)
      })

      if (newMarkers.length > 0) {
        if (markerLayer.getBounds() && markerLayer.getBounds().isValid()) {
          map.fitBounds(markerLayer.getBounds(), { maxZoom })
        }
      }
    },
    [map, markerLayer]
  )

  useEffect(() => {
    Map.addInitHook("addHandler", "gestureHandling", GestureHandling)
    const mapOptions = Object.assign(
      { zoomControl: true, gestureHandling: true },
      Settings.imagery.mapOptions.leafletOptions,
      Settings.imagery.mapOptions.crs && {
        crs: CRS[Settings.imagery.mapOptions.crs]
      }
    )
    const newMap = new Map(mapId, mapOptions).setView(
      Settings.imagery.mapOptions.homeView.location,
      Settings.imagery.mapOptions.homeView.zoomLevel
    )
    if (searchProvider) {
      const gsc = new GeoSearchControl({ provider: searchProvider })
      setTimeout(() => {
        // workaround for preventing the marker from moving when search icon is clicked
        // https://github.com/smeijer/leaflet-geosearch/issues/169#issuecomment-458573562
        gsc.getContainer().onclick = e => e.stopPropagation()
      })
      gsc.addTo(newMap)
    }
    const layerControl = new Control.Layers({}, {}, { collapsed: false })
    layerControl.addTo(newMap)
    addLayers(newMap, layerControl)
    setLayerControl(layerControl)

    setMap(newMap)

    const newMarkerLayer = new MarkerClusterGroup().addTo(newMap)
    setMarkerLayer(newMarkerLayer)

    setDoInitializeMarkerLayer(true)
  }, [mapId])

  useEffect(() => {
    /*
     * If map container is not fully visible and not focused, Google Chrome scrolls down
     * to make whole container visible when it is focused. Thus when clicked on the map,
     * a scroll event gets fired before click event. Leaflet calculates lon/lat coordinates
     * with respect to the click event X and Y coordinates. Since the click event is fired
     * after scroll, map coordinates shift with respect to click event X - Y coordinates
     * and eventually marker is placed a certain amount (scrolled height to be precise)
     * belove the clicked point. Firefox doesn't behave this way and everything works as expected.
     *
     * see https://github.com/Leaflet/Leaflet/issues/4125
     *
     * It works fine as long as map container is fully visible on screen.
     */
    if (map && onMapClick) {
      const clickHandler = event => onMapClick(event, map)
      map.on("click", clickHandler)
      return () => map.off("click", clickHandler)
    }
  }, [onMapClick, map])

  useEffect(() => {
    if (
      !doInitializeMarkerLayer &&
      markerLayer &&
      JSON.stringify(prevMarkersRef.current) !== JSON.stringify(markers)
    ) {
      // setTimeout is a workaround for "Uncaught DOMException: Failed to execute 'removeChild' on 'Node':
      // The node to be removed is no longer a child of this node." error
      setTimeout(() => {
        markerLayer.clearLayers()
        updateMarkerLayer(markers, map.getZoom())
      })
    }
  }, [doInitializeMarkerLayer, markerLayer, updateMarkerLayer, map, markers])

  useEffect(() => {
    prevMarkersRef.current = markers
  }, [markers])

  useEffect(() => {
    if (doInitializeMarkerLayer) {
      updateMarkerLayer(markers)
      setDoInitializeMarkerLayer(false)
    }
  }, [doInitializeMarkerLayer, markers, updateMarkerLayer])

  useEffect(() => {
    if (map && !(widthPropUnchanged && heightPropUnchanged)) {
      map.invalidateSize()
      latestWidth.current = width
      latestHeight.current = height
    }
  }, [
    height,
    heightPropUnchanged,
    map,
    markerLayer,
    markers,
    width,
    widthPropUnchanged
  ])

  useEffect(() => {
    if (!map || !layerControl || !allLocations?.length) {
      return
    }
    const allMarkers = allLocations
      .filter(loc => Location.hasCoordinates(loc))
      .map(location => {
        const popupContent = document.createElement("div")
        popupContent.setAttribute("style", "width: 300px;text-align: center")

        return new Marker([location.lat, location.lng], {
          icon: locationIcon,
          draggable: false,
          autoPan: false,
          id: location.uuid
        })
          .bindTooltip(location.name, {
            direction: "top",
            permanent: true,
            offset: [0, -58]
          })
          .bindPopup(popupContent)
          .on("popupopen", e => {
            ReactDOM.render(
              <>
                <b>{location.name}</b> @{" "}
                <GeoLocation
                  coordinates={{
                    lat: location.lat,
                    lng: location.lng,
                    displayedCoordinate: convertLatLngToMGRS(
                      location.lat,
                      location.lng
                    )
                  }}
                />
              </>,
              e.popup.getContent()
            )
          })
      })

    const locationsLayer = new MarkerClusterGroup({
      iconCreateFunction: function(cluster) {
        return new DivIcon({
          className: "all-locations-marker-cluster-icon-container",
          html: `
              <img src="${MARKER_FLAG_BLUE}" class="alm-cluster-icon" alt="" />
              <div class="alm-cluster-text">${cluster.getChildCount()}</div>
          `
        })
      }
    }).addLayers(allMarkers)

    layerControl.addOverlay(locationsLayer, "All Locations")
    locationsLayer.addTo(map) // make "All Locations" selected by default

    return () => {
      layerControl.removeLayer(locationsLayer)
      map.removeLayer(locationsLayer)
    }
  }, [map, layerControl, allLocations])

  return <div id={mapId} style={style} />
}
BaseLeaflet.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  markers: PropTypes.array,
  allLocations: PropTypes.arrayOf(PropTypes.object).isRequired,
  mapId: PropTypes.string, // pass this when you have more than one map on a page
  onMapClick: PropTypes.func
}
BaseLeaflet.defaultProps = {
  width: "100%",
  height: "500px",
  marginBottom: "18px"
}

const Leaflet = props => (
  <AppContext.Consumer>
    {context => <BaseLeaflet allLocations={context.allLocations} {...props} />}
  </AppContext.Consumer>
)

export default Leaflet
