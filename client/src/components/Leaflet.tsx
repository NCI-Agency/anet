import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import {
  Control,
  CRS,
  DivIcon,
  FeatureGroup,
  geoJSON,
  Icon,
  LatLngBounds,
  Map,
  Marker,
  Point,
  TileLayer
} from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css"
import { FullScreen } from "leaflet.fullscreen"
import "leaflet.fullscreen/dist/Control.FullScreen.css"
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
import GeoLocation from "components/GeoLocation"
import { convertLatLngToMGRS, parseCoordinate } from "geoUtils"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "react-bootstrap"
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
      style: "width: 250px;"
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

function wrapLng(lng: number) {
  // Wrap lng around the antimeridian
  return lng < 0 ? lng + 360 : lng - 360
}

function unwrapLng(lng: number) {
  // Unwrap lng around the antimeridian
  if (lng < -180) {
    return lng + 360
  } else if (lng > 180) {
    return lng - 360
  } else {
    return lng
  }
}

function getUnwrappedLayerBounds(layerBounds: LatLngBounds) {
  if (layerBounds?.isValid()) {
    const southWest = layerBounds.getSouthWest()
    southWest.lng = unwrapLng(southWest.lng)
    const northEast = layerBounds.getNorthEast()
    northEast.lng = unwrapLng(northEast.lng)
    return new LatLngBounds(southWest, northEast)
  }
  return layerBounds
}

function getExistingIds(layerGroup) {
  const ids = new Set<string>()
  layerGroup?.eachLayer((layer: any) => {
    if (layer?.options?.id) {
      ids.add(String(layer.options.id))
    }
  })
  return ids
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
  shapes?: any[]
  mapId?: string
  onMapClick?: (...args: unknown[]) => unknown // pass this when you have more than one map on a page
  onSelectAnetLocation?: (loc: any) => void
  allowCreateLocation?: boolean
  onCreateLocation?: (coords: { lat: number; lng: number }) => void
}

const GET_ANET_LOCATIONS_GQL = gql`
  query ($bounds: BoundingBoxInput!) {
    locationList(query: { boundingBox: $bounds, status: ACTIVE, pageSize: 0 }) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
    }
  }
`

const GET_ANET_COUNTRIES_GQL = gql`
  query {
    locationList(query: { type: COUNTRY, status: ACTIVE, pageSize: 0 }) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Location}
        type
        geoJson
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
  shapes,
  mapId: initialMapId,
  onMapClick,
  onSelectAnetLocation,
  allowCreateLocation,
  onCreateLocation
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
  const shapeGroupLayerRef = useRef(new FeatureGroup())

  const anetLocationsLayerRef = useRef(null)
  const [anetLocationsEnabled, setAnetLocationsEnabled] = useState(false)
  const [anetLocationsVars, setAnetLocationsVars] = useState({})

  const anetCountriesLayerRef = useRef(null)
  const [anetCountriesEnabled, setAnetCountriesEnabled] = useState(false)

  const createLocationMarkerRef = useRef<Marker | null>(null)
  const [createLocationMarkerPopup, setCreateLocationMarkerPopup] =
    useState<MarkerPopupProps>({})

  const updateMarkerLayer = useCallback(
    (newMarkers = [], maxZoom = 15) => {
      newMarkers.forEach(m => {
        const latLng = Location.hasCoordinates(m)
          ? [m.lat, m.lng]
          : map.getCenter()
        markerLayer.addLayer(createMarker(latLng, m, setMarkerPopup, map))
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

  useEffect(() => {
    Map.addInitHook("addHandler", "gestureHandling", GestureHandling)
    const mapOptions = Object.assign(
      {
        zoomControl: true,
        gestureHandling: true,
        worldCopyJump: true
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
    newMap.addControl(new FullScreen({ position: "topleft" }))
    if (searchProvider) {
      newMap.addControl(
        GeoSearchControl({
          provider: searchProvider,
          marker: {
            icon: iconSearch,
            draggable: false
          }
        })
      )
    }
    const layerControl = new Control.Layers({}, {}, { collapsed: true })
    layerControl.addTo(newMap)
    shapeGroupLayerRef.current.addTo(newMap)
    addLayers(newMap, layerControl)

    setMap(newMap)

    const newMarkerLayer = new MarkerClusterGroup().addTo(newMap)
    setMarkerLayer(newMarkerLayer)

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
    if (onSelectAnetLocation) {
      // Always add the layer to the map
      newMap.addLayer(anetLocationsLayer, "ANET Locations")
      setAnetLocationsEnabled(true)
      updateAnetLocationsVarsFromMap()
    } else {
      // Allow the user to show/hide the layer
      layerControl.addOverlay(anetLocationsLayer, "ANET Locations")
    }

    newMap.on("overlayadd", e => {
      if (e.layer === anetLocationsLayer) {
        setAnetLocationsEnabled(true)
        updateAnetLocationsVarsFromMap()
      }
    })
    newMap.on("overlayremove", e => {
      if (e.layer === anetLocationsLayer) {
        setAnetLocationsEnabled(false)
        anetLocationsLayer.clearLayers()
      }
    })
    newMap.on("moveend", () => {
      if (newMap.hasLayer(anetLocationsLayer)) {
        updateAnetLocationsVarsFromMap()
      }
    })

    // anetCountries layer
    const anetCountriesLayer = new FeatureGroup()
    anetCountriesLayerRef.current = anetCountriesLayer
    // Allow the user to show/hide the layer
    layerControl.addOverlay(anetCountriesLayer, "ANET Countries")

    newMap.on("overlayadd", e => {
      if (e.layer === anetCountriesLayer) {
        setAnetCountriesEnabled(true)
      }
    })
    newMap.on("overlayremove", e => {
      if (e.layer === anetCountriesLayer) {
        setAnetCountriesEnabled(false)
        anetCountriesLayer.clearLayers()
      }
    })

    setDoInitializeMarkerLayer(true)

    // Destroy map when done
    return () => newMap.remove()
  }, [mapId])

  useEffect(() => {
    if (!anetLocationsEnabled || !anetLocationsLayerRef.current) {
      return
    }

    const getAnetLocations = async () =>
      await API.query(GET_ANET_LOCATIONS_GQL, anetLocationsVars)

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

          layer.addLayer(
            createMarker(
              [loc.lat, loc.lng],
              m,
              setLocationMarkerPopup,
              map,
              -1000
            )
          )
          // Add a copy of the marker, wrapped around the antimeridian
          layer.addLayer(
            createMarker(
              [loc.lat, wrapLng(loc.lng)],
              m,
              setLocationMarkerPopup,
              map,
              -1000
            )
          )
        })
      })
      .catch(() => {})
  }, [
    anetLocationsEnabled,
    anetLocationsVars,
    markerLayer,
    map,
    setLocationMarkerPopup
  ])

  useEffect(() => {
    if (!anetCountriesEnabled || !anetCountriesLayerRef.current) {
      return
    }

    const getAnetCountries = async () => await API.query(GET_ANET_COUNTRIES_GQL)

    getAnetCountries()
      .then(rows => {
        const anetCountries = rows?.locationList?.list || []
        const layer = anetCountriesLayerRef.current

        const existingIds = getExistingIds(shapeGroupLayerRef.current)

        layer.clearLayers()
        anetCountries?.forEach((country: any) => {
          if (!country.geoJson || existingIds.has(country.uuid)) {
            return
          }

          try {
            const geoJsonObject = JSON.parse(country.geoJson)
            const geoJsonLayer = geoJSON(geoJsonObject, {
              id: country.uuid,
              interactive: false,
              color: "#00d8ff",
              opacity: 0.1
            })
            geoJsonLayer.addTo(layer)
          } catch {}
        })
      })
      .catch(() => {})
  }, [anetCountriesEnabled])

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
    if (!map || (!onMapClick && !allowCreateLocation)) {
      return
    }

    // Timeout used to distinguish single click vs double click
    let clickTimeout = null

    const handleSingleClick = event => {
      const { latlng } = event || {}

      if (allowCreateLocation && latlng) {
        const parsedLat = parseCoordinate(latlng.lat)
        const parsedLng = parseCoordinate(latlng.lng)
        let marker = createLocationMarkerRef.current

        if (_isEmpty(marker)) {
          marker = createMarker(
            latlng,
            { contents: { lat: parsedLat, lng: parsedLng }, autoPan: true },
            setCreateLocationMarkerPopup,
            map
          )
          map.addLayer(marker)
          createLocationMarkerRef.current = marker
        } else {
          marker.setLatLng(latlng)
        }

        marker.openPopup()
      }

      onMapClick?.(event, map)
    }

    const clickHandler = event => {
      // Every click resets the timer
      // But only the last isolated click fires handleSingleClick
      if (clickTimeout != null) {
        window.clearTimeout(clickTimeout)
      }
      clickTimeout = window.setTimeout(() => {
        handleSingleClick(event)
        clickTimeout = null
      }, 500)
    }

    const dblClickHandler = () => {
      // If a double click happens, cancel the pending single click handler
      if (clickTimeout != null) {
        window.clearTimeout(clickTimeout)
        clickTimeout = null
      }
    }

    map.on("click", clickHandler)
    map.on("dblclick", dblClickHandler)

    return () => {
      if (clickTimeout != null) {
        window.clearTimeout(clickTimeout)
      }
      map.off("click", clickHandler)
      map.off("dblclick", dblClickHandler)

      if (createLocationMarkerRef.current) {
        map.removeLayer(createLocationMarkerRef.current)
        createLocationMarkerRef.current = null
      }
    }
  }, [allowCreateLocation, map, onCreateLocation, onMapClick])

  useEffect(() => {
    if (
      !doInitializeMarkerLayer &&
      markerLayer &&
      prevMarkersRef.current !== markers
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

  // Handle assigned shapes (GeoJSON strings)
  useEffect(() => {
    if (!map) {
      return
    }

    const groupLayer = shapeGroupLayerRef.current
    groupLayer.clearLayers()

    if (!_isEmpty(shapes)) {
      shapes.forEach(shape => {
        try {
          const geoJsonObject = JSON.parse(shape.geoJson)
          const geoJsonLayer = geoJSON(geoJsonObject, {
            id: shape.id,
            interactive: false
          })
          geoJsonLayer.addTo(groupLayer)
        } catch {}
      })
    }

    // Try to combine groupLayer bounds with (unwrapped) markerLayer bounds
    const groupLayerBounds = groupLayer.getBounds()
    if (groupLayerBounds?.isValid()) {
      const unwrappedMarkerLayerBounds = getUnwrappedLayerBounds(
        markerLayer.getBounds()
      )
      map.fitBounds(
        unwrappedMarkerLayerBounds?.isValid()
          ? groupLayerBounds.extend(unwrappedMarkerLayerBounds)
          : groupLayerBounds
      )
    }
  }, [shapes, map, markerLayer])

  return (
    <>
      <div id={mapId} style={style} />
      {locationMarkerPopup.container &&
        createPortal(
          renderLocationMarkerPopupContents(locationMarkerPopup.contents),
          locationMarkerPopup.container
        )}
      {createLocationMarkerPopup.container &&
        createPortal(
          renderCreateLocationMarkerPopupContents(
            createLocationMarkerPopup.contents
          ),
          createLocationMarkerPopup.container
        )}
    </>
  )

  function renderLocationMarkerPopupContents(location) {
    return (
      <div className="d-flex flex-column justify-content-center">
        <LinkTo modelType="Location" model={location} />
        {onSelectAnetLocation && (
          <Button
            onClick={() => onSelectAnetLocation(location)}
            variant="primary"
            className="mt-2"
          >
            Select this location
          </Button>
        )}
      </div>
    )
  }

  function renderCreateLocationMarkerPopupContents(location) {
    return (
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-2">
          {Location.LOCATION_FORMAT_LABELS[Location.locationFormat]}:
          <GeoLocation
            coordinates={{
              lat: location.lat,
              lng: location.lng,
              displayedCoordinate: convertLatLngToMGRS(
                location.lat,
                location.lng
              )
            }}
            showAllFormatsInfo={false}
          />
        </div>
        <Button
          onClick={() => {
            if (map._isFullscreen) {
              map.toggleFullscreen()
            }
            onCreateLocation(location)
          }}
          variant="primary"
          className="mt-2"
        >
          Create a new location here
        </Button>
      </div>
    )
  }
}

function renderSelectedLocationMarkerPopupContents(location) {
  return (
    <div className="d-flex flex-column justify-content-center">
      <LinkTo
        modelType="Location"
        model={{ uuid: location?.uuid, name: location?.name }}
      />
    </div>
  )
}

interface LeafletWithSelectionProps {
  mapId: string
  location?: any
  onSelectAnetLocation: (loc: any) => void
  allowCreateLocation?: boolean
  onCreateLocation?: (coords: { lat: number; lng: number }) => void
}

export const LeafletWithSelection = ({
  mapId,
  location,
  onSelectAnetLocation,
  allowCreateLocation,
  onCreateLocation
}: LeafletWithSelectionProps) => {
  const [markerPopup, setMarkerPopup] = useState<MarkerPopupProps>({})
  const markers = useMemo(
    () =>
      location && Location.hasCoordinates(location)
        ? [
            {
              id: location.uuid,
              lat: Number(location.lat),
              lng: Number(location.lng),
              contents: location
            }
          ]
        : [],
    [location]
  )
  return (
    <>
      <Leaflet
        mapId={mapId}
        markers={markers}
        onSelectAnetLocation={onSelectAnetLocation}
        setMarkerPopup={setMarkerPopup}
        allowCreateLocation={allowCreateLocation}
        onCreateLocation={onCreateLocation}
      />
      {markerPopup.container &&
        createPortal(
          renderSelectedLocationMarkerPopupContents(markerPopup.contents),
          markerPopup.container
        )}
    </>
  )
}

export default Leaflet
