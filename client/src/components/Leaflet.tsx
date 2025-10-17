import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import {
  Control,
  CRS,
  DivIcon,
  Icon,
  Map,
  Marker,
  Point,
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
import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import MARKER_ICON_2X from "resources/leaflet/marker-icon-2x.png"
import MARKER_ICON_AMBER_2X from "resources/leaflet/marker-icon-amber-2x.png"
import MARKER_ICON_AMBER from "resources/leaflet/marker-icon-amber.png"
import MARKER_ICON_BLUE_2X from "resources/leaflet/marker-icon-blue-2x.png"
import MARKER_ICON_BLUE from "resources/leaflet/marker-icon-blue.png"
import MARKER_ICON_GREEN_2X from "resources/leaflet/marker-icon-green-2x.png"
import MARKER_ICON_GREEN from "resources/leaflet/marker-icon-green.png"
import MARKER_ICON_LIGHT_2X from "resources/leaflet/marker-icon-light-2x.png"
import MARKER_ICON_LIGHT from "resources/leaflet/marker-icon-light.png"
import MARKER_ICON_SEARCH from "resources/leaflet/marker-icon-search.svg"
import MARKER_ICON from "resources/leaflet/marker-icon.png"
import MARKER_SHADOW from "resources/leaflet/marker-shadow.png"
import Settings from "settings"

export const DEFAULT_MAP_STYLE = {
  width: "100%",
  height: "500px",
  marginBottom: "18px"
}

const css = {
  zIndex: 1
}

class CustomUrlEsriProvider extends EsriProvider {
  constructor(searchUrl, options = {}) {
    super(options)
    if (searchUrl) {
      this.searchUrl = searchUrl
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
const iconLight = new Icon({
  ...commonIconProps,
  iconUrl: MARKER_ICON_LIGHT,
  iconRetinaUrl: MARKER_ICON_LIGHT_2X
})
export const ICON_TYPES = {
  AMBER: iconAmber,
  BLUE: iconBlue,
  GREEN: iconGreen,
  LIGHT: iconLight,
  DEFAULT: iconDefault
}

const iconSearch = new Icon({
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  iconUrl: MARKER_ICON_SEARCH
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

function createMarker(
  latLng,
  m,
  setPopup: (markerPopupProps: MarkerPopupProps) => void,
  map,
  zIndexOffset
) {
  const marker = new Marker(latLng, {
    icon: m.icon || ICON_TYPES.DEFAULT,
    draggable: m.draggable || false,
    autoPan: m.autoPan || false,
    id: m.id,
    zIndexOffset
  })
  if (m.name) {
    marker.bindPopup(m.name)
  } else if (m.contents) {
    const popupDiv = Object.assign(document.createElement("div"), {
      id: m.id,
      style: "width: 200px;"
    })
    marker.bindPopup(() => {
      setPopup?.({ container: popupDiv, contents: m.contents })
      return popupDiv
    })
  }
  if (m.onMove) {
    marker.on("moveend", event => m.onMove(event, map))
  }
  return marker
}

function wrapLng(lng) {
  // Wrap lng around the antimeridian
  return lng < 0 ? lng + 360.0 : lng - 360.0
}

export interface MarkerPopupProps {
  container?: HTMLElement
  contents?: any
}

interface LeafletProps {
  width?: number | string
  height?: number | string
  marginBottom?: number | string
  markers?: any[]
  setMarkerPopup?: (markerPopup: MarkerPopupProps) => void
  mapId?: string
  anetLocationsSelected?: boolean
  onMapClick?: (...args: unknown[]) => unknown // pass this when you have more than one map on a page
  onSelectLocation?: (loc: any) => void
}

const NEARBY_LOCATIONS_GQL = gql`
  query ($bounds: BoundingBoxInput!) {
    locationList(query: { boundingBox: $bounds, pageSize: 0 }) {
      pageNum
      pageSize
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

const Leaflet = ({
  width = DEFAULT_MAP_STYLE.width,
  height = DEFAULT_MAP_STYLE.height,
  marginBottom = DEFAULT_MAP_STYLE.marginBottom,
  markers,
  setMarkerPopup,
  mapId: initialMapId,
  anetLocationsSelected,
  onMapClick,
  onSelectLocation
}: LeafletProps) => {
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
  const [locationMarkerPopup, setLocationMarkerPopup] =
    useState<MarkerPopupProps>({})
  const [doInitializeMarkerLayer, setDoInitializeMarkerLayer] = useState(false)
  const prevMarkersRef = useRef(null)

  const anetLocationsLayerRef = useRef(null)
  const [anetLocationsEnabled, setAnetLocationsEnabled] = useState(false)
  const [anetLocationsVars, setAnetLocationsVars] = useState({})

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
        } else if (m.contents) {
          const popupDiv = Object.assign(document.createElement("div"), {
            id: m.id,
            style: "width: 200px;"
          })
          marker.bindPopup(() => {
            setMarkerPopup?.({ container: popupDiv, contents: m.contents })
            return popupDiv
          })
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

      // Add a copy of each marker, wrapped around the antimeridian
      newMarkers.forEach(m => {
        if (Location.hasCoordinates(m)) {
          markerLayer.addLayer(
            createMarker([m.lat, wrapLng(m.lng)], m, setMarkerPopup, map)
          )
        }
      })
    },
    [map, markerLayer, setMarkerPopup]
  )

  const lockAnetCheckbox = (layerControl: Control.Layers) => {
    const container = layerControl.getContainer?.()
    if (!container) {
      return
    }

    const labels = container.querySelectorAll<HTMLLabelElement>(
      ".leaflet-control-layers-overlays label"
    )
    labels.forEach((label: HTMLLabelElement) => {
      const text = (label.textContent || "").trim()
      if (text === "ANET Locations") {
        const input = label.querySelector<HTMLInputElement>(
          'input[type="checkbox"]'
        )
        if (!input) {
          return
        }

        input.checked = true
        input.disabled = true
        input.tabIndex = -1
        input.setAttribute("aria-disabled", "true")
        label.style.opacity = "0.6"
        label.style.pointerEvents = "none"
      }
    })
  }

  useEffect(() => {
    Map.addInitHook("addHandler", "gestureHandling", GestureHandling)
    const mapOptions = Object.assign(
      {
        zoomControl: true,
        gestureHandling: true,
        worldCopyJump: true,
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
      const gsc = new GeoSearchControl({
        provider: searchProvider,
        marker: {
          icon: iconSearch,
          draggable: false
        }
      })
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

    // anetLocations layer
    const anetLocationsLayer = new MarkerClusterGroup({
      iconCreateFunction: cluster => {
        const childCount = cluster.getChildCount()

        let c = " marker-cluster-"
        if (childCount < 10) {
          c += "small"
        } else if (childCount < 100) {
          c += "medium"
        } else {
          c += "large"
        }

        return new DivIcon({
          html: `<div><span>${childCount}</span></div>`,
          className: `marker-cluster locations-marker-cluster ${c}`,
          iconSize: new Point(40, 40)
        })
      }
    })
    anetLocationsLayerRef.current = anetLocationsLayer
    layerControl.addOverlay(anetLocationsLayer, "ANET Locations")

    const updateAnetLocationsVarsFromMap = () => {
      const mapBounds = newMap.wrapLatLngBounds(newMap.getBounds())
      const bounds = {
        minLng: mapBounds._southWest.lng,
        minLat: mapBounds._southWest.lat,
        maxLng: mapBounds._northEast.lng,
        maxLat: mapBounds._northEast.lat
      }
      // Make sure bounds are a valid rectangle; e.g. during resize bounds could be a line or even a point
      if (bounds.minLng !== bounds.maxLng && bounds.minLat !== bounds.maxLat) {
        setAnetLocationsVars({ bounds })
      }
    }

    if (anetLocationsSelected) {
      newMap.addLayer(anetLocationsLayer)
      setAnetLocationsEnabled(true)
      updateAnetLocationsVarsFromMap()
      setTimeout(() => lockAnetCheckbox(layerControl), 0)
    }

    newMap.on("overlayadd", e => {
      if (e.layer === anetLocationsLayer) {
        setAnetLocationsEnabled(true)
        updateAnetLocationsVarsFromMap()
        if (anetLocationsSelected) {
          setTimeout(() => lockAnetCheckbox(layerControl), 0)
        }
      }
    })
    newMap.on("overlayremove", e => {
      if (e.layer === anetLocationsLayer) {
        if (anetLocationsSelected) {
          newMap.addLayer(anetLocationsLayer)
          return
        }
        setAnetLocationsEnabled(false)
        anetLocationsLayer.clearLayers()
      }
    })
    newMap.on("moveend", () => {
      if (newMap.hasLayer(anetLocationsLayer)) {
        updateAnetLocationsVarsFromMap()
      }
    })
    newMap.on("zoomend", () => {
      if (anetLocationsSelected) {
        lockAnetCheckbox(layerControl)
      }
    })

    setDoInitializeMarkerLayer(true)

    // Destroy map when done
    return () => newMap.remove()
  }, [mapId])

  function getExistingIds(layerGroup) {
    const ids = new Set<string>()
    layerGroup?.eachLayer((layer: any) => {
      if (layer?.options?.id) {
        ids.add(String(layer.options.id))
      }
    })
    return ids
  }

  function bindAnetlocationsPopup(marker, loc, onSelect, setPortal) {
    const container = document.createElement("div")
    container.className = "d-flex flex-column"
    container.style.width = "200px"

    const reactMount = document.createElement("div")
    reactMount.id = `nearby-popup-${loc?.uuid}`
    container.appendChild(reactMount)

    if (onSelect) {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.textContent = "Select this location"
      btn.className = "btn btn-sm btn-primary mt-2"
      btn.addEventListener("click", e => {
        e.preventDefault()
        e.stopPropagation()
        onSelect(loc)
        marker.closePopup()
      })
      container.appendChild(btn)
    }

    marker.bindPopup(() => {
      setPortal?.({ container: reactMount, contents: loc })
      return container
    })
  }

  useEffect(() => {
    if (!anetLocationsEnabled || !anetLocationsLayerRef.current) {
      return
    }

    const getAnetLocations = async () =>
      await API.query(NEARBY_LOCATIONS_GQL, anetLocationsVars)

    getAnetLocations()
      .then(rows => {
        const anetLocations = rows?.locationList?.list || []
        const layer = anetLocationsLayerRef.current

        const existingIds = getExistingIds(markerLayer)

        layer.clearLayers()
        anetLocations?.forEach((loc: any) => {
          if (!Location.hasCoordinates(loc) || existingIds.has(loc.uuid)) {
            return
          }
          const m = {
            icon: ICON_TYPES.LIGHT,
            id: loc.uuid,
            contents: loc
          }
          const marker = createMarker(
            [loc.lat, loc.lng],
            m,
            setLocationMarkerPopup,
            map,
            -1000
          )
          layer.addLayer(marker)
          bindAnetlocationsPopup(
            marker,
            loc,
            onSelectLocation,
            setLocationMarkerPopup
          )

          // Add and bind a copy of the marker, wrapped around the antimeridian
          const wrappedMarker = createMarker(
            [loc.lat, wrapLng(loc.lng)],
            m,
            setLocationMarkerPopup,
            map,
            -1000
          )
          layer.addLayer(wrappedMarker)
          bindAnetlocationsPopup(
            wrappedMarker,
            loc,
            onSelectLocation,
            setLocationMarkerPopup
          )
        })
      })
      .catch(() => {})
  }, [
    anetLocationsEnabled,
    anetLocationsVars,
    markerLayer,
    map,
    onSelectLocation,
    setLocationMarkerPopup
  ])

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

  return (
    <>
      <div id={mapId} style={style} />
      {locationMarkerPopup.container &&
        createPortal(
          renderLocationMarkerPopupContents(locationMarkerPopup.contents),
          locationMarkerPopup.container
        )}
    </>
  )

  function renderLocationMarkerPopupContents(location) {
    return (
      <LinkTo
        modelType="Location"
        model={{ uuid: location?.uuid, name: location?.name }}
      />
    )
  }
}

export default Leaflet
