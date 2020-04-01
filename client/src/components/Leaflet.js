import { Settings } from "api"
import { Control, CRS, Icon, Map, Marker, TileLayer } from "leaflet"
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
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import MARKER_ICON_2X from "resources/leaflet/marker-icon-2x.png"
import MARKER_ICON from "resources/leaflet/marker-icon.png"
import MARKER_SHADOW from "resources/leaflet/marker-shadow.png"

const css = {
  zIndex: 1
}

class CustomUrlEsriProvider extends EsriProvider {
  constructor(options = {}) {
    super(options)
  }

  endpoint({ query, protocol } = {}) {
    const { params } = this.options
    const paramString = this.getParamString({
      ...params,
      f: "json",
      text: query
    })
    return `${protocol}//${this.options.url}?${paramString}`
  }
}

const geoSearcherProviders = {
  ESRI: () => {
    return new CustomUrlEsriProvider({
      url: Settings.imagery.geoSearcher.url,
      params: { maxLocations: 10 }
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

    setMap(newMap)

    const newMarkerLayer = new MarkerClusterGroup().addTo(newMap)
    setMarkerLayer(newMarkerLayer)

    setDoInitializeMarkerLayer(true)
  }, [mapId])

  useEffect(() => {
    // if the map container is not fully visible and not focused, google chrome scrolls down to make whole container visible when it is focused
    // thus when clicked on the map, a scroll event gets fired before click event
    // leaflet calculates lon/lat coordinates with respect to the click event X and Y coordinates
    // since the click event is fired after scroll, map coordinates shift with respect to click event X - Y coordinates
    // and eventually marker is placed a certain amount (scrolled height to be precise) belove the clicked point
    // firefox doesn't behave this way and everything works as expected
    // see https://github.com/Leaflet/Leaflet/issues/4125
    if (map && onMapClick) {
      map.on("click", event => onMapClick(event, map))
      return () => map.off("click")
    }
  }, [onMapClick, map])

  useEffect(() => {
    if (
      !doInitializeMarkerLayer &&
      markerLayer &&
      JSON.stringify(prevMarkersRef.current) !== JSON.stringify(markers)
    ) {
      // setTimeout is a workaround for "Uncaught DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node."
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

  return <div id={mapId} style={style} />
}
Leaflet.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  markers: PropTypes.array,
  mapId: PropTypes.string, // pass this when you have more than one map on a page
  onMapClick: PropTypes.func
}
Leaflet.defaultProps = {
  width: "100%",
  height: "500px",
  marginBottom: "18px"
}

export default Leaflet
