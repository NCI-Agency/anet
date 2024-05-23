import {
  Control,
  CRS,
  FeatureGroup,
  geoJSON,
  Icon,
  Map,
  Marker,
  TileLayer
} from "leaflet"
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
import "leaflet.fullscreen"
import "leaflet.fullscreen/Control.FullScreen.css"
import { MarkerClusterGroup } from "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet/dist/leaflet.css"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import MARKER_ICON_2X from "resources/leaflet/marker-icon-2x.png"
import MARKER_ICON_AMBER_2X from "resources/leaflet/marker-icon-amber-2x.png"
import MARKER_ICON_AMBER from "resources/leaflet/marker-icon-amber.png"
import MARKER_ICON_BLUE_2X from "resources/leaflet/marker-icon-blue-2x.png"
import MARKER_ICON_BLUE from "resources/leaflet/marker-icon-blue.png"
import MARKER_ICON_GREEN_2X from "resources/leaflet/marker-icon-green-2x.png"
import MARKER_ICON_GREEN from "resources/leaflet/marker-icon-green.png"
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

const commonIconProps = {
  shadowUrl: MARKER_SHADOW,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
}
const iconAmber = new Icon({
  ...commonIconProps,
  iconUrl: MARKER_ICON_AMBER,
  iconRetinaUrl: MARKER_ICON_AMBER_2X
})
const iconBlue = new Icon({
  ...commonIconProps,
  iconUrl: MARKER_ICON_BLUE,
  iconRetinaUrl: MARKER_ICON_BLUE_2X
})
const iconGreen = new Icon({
  ...commonIconProps,
  iconUrl: MARKER_ICON_GREEN,
  iconRetinaUrl: MARKER_ICON_GREEN_2X
})
const iconDefault = new Icon({
  ...commonIconProps,
  iconUrl: MARKER_ICON,
  iconRetinaUrl: MARKER_ICON_2X
})
export const ICON_TYPES = {
  AMBER: iconAmber,
  BLUE: iconBlue,
  GREEN: iconGreen,
  DEFAULT: iconDefault
}

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

const Leaflet = ({
  width,
  height,
  marginBottom,
  markers,
  shapes,
  mapId: initialMapId,
  onMapClick
}) => {
  const mapId = "map-" + (initialMapId || "default")
  const style = Object.assign({}, css, {
    width,
    height,
    marginBottom
  })

  const latestWidth = useRef(width)
  const widthPropUnchanged = latestWidth.current === width

  const latestHeight = useRef(height)
  const heightPropUnchanged = latestHeight.current === height

  const [map, setMap] = useState(null)
  const [markerLayer, setMarkerLayer] = useState(null)
  const [doInitializeMarkerLayer, setDoInitializeMarkerLayer] = useState(false)
  const prevMarkersRef = useRef()
  const shapeGroupLayerRef = useRef(new FeatureGroup())

  const updateMarkerLayer = useCallback(
    (newMarkers = [], maxZoom = 15) => {
      newMarkers.forEach(m => {
        const latLng = Location.hasCoordinates(m)
          ? [m.lat, m.lng]
          : map.getCenter()
        const marker = new Marker(latLng, {
          icon: m.icon || ICON_TYPES.DEFAULT,
          draggable: m.draggable || false,
          autoPan: m.autoPan || false,
          id: m.id
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
      {
        zoomControl: true,
        gestureHandling: true,
        fullscreenControl: true,
        fullscreenControlOptions: { position: "topleft" }
      },
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
    shapeGroupLayerRef.current.addTo(newMap)
    addLayers(newMap, layerControl)

    setMap(newMap)

    const newMarkerLayer = new MarkerClusterGroup().addTo(newMap)
    setMarkerLayer(newMarkerLayer)

    setDoInitializeMarkerLayer(true)

    // Destroy map when done
    return () => newMap.remove()
  }, [mapId])

  useEffect(() => {
    /*
     * If map container is not fully visible and not focused, Google Chrome scrolls down
     * to make whole container visible when it is focused. Thus when clicked on the map,
     * a scroll event gets fired before click event. Leaflet calculates lon/lat coordinates
     * with respect to the click event X and Y coordinates. Since the click event is fired
     * after scroll, map coordinates shift with respect to click event X - Y coordinates
     * and eventually marker is placed a certain amount (scrolled height to be precise)
     * below the clicked point. Firefox doesn't behave this way and everything works as expected.
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

  /**
   * Handle assigned shapes (GeoJSON strings)
   */
  useEffect(() => {
    const groupLayer = shapeGroupLayerRef.current
    if (shapes && map) {
      shapes.forEach(shape => {
        const geoJsonObject = JSON.parse(shape)
        const geoJsonLayer = geoJSON(geoJsonObject)
        geoJsonLayer.addTo(groupLayer)
      })
      // Set map bounds (navigate) to include all shapes
      map.fitBounds(groupLayer.getBounds())
    }
  }, [shapes, map])

  return <div id={mapId} style={style} />
}
Leaflet.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  markers: PropTypes.array,
  shapes: PropTypes.array,
  mapId: PropTypes.string, // pass this when you have more than one map on a page
  onMapClick: PropTypes.func
}
Leaflet.defaultProps = {
  width: "100%",
  height: "500px",
  marginBottom: "18px"
}

export default Leaflet
