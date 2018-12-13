import PropTypes from 'prop-types'
import React, {Component} from 'react'
import autobind from 'autobind-decorator'
import {Location} from 'models'
import AppContext from 'components/AppContext'
import _escape from 'lodash/escape'
import _isEqual from 'lodash/isEqual'
import _sortBy from 'lodash/sortBy'

import {Map, Control, CRS, FeatureGroup, Icon, Marker, TileLayer} from 'leaflet'
import { GeoSearchControl, OpenStreetMapProvider, EsriProvider } from 'leaflet-geosearch'
import { GestureHandling } from 'leaflet-gesture-handling'
import 'leaflet/dist/leaflet.css'
import 'leaflet-geosearch/assets/css/leaflet.css'
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css'
import Settings from 'Settings'

import MARKER_ICON from 'resources/leaflet/marker-icon.png'
import MARKER_ICON_2X from 'resources/leaflet/marker-icon-2x.png'
import MARKER_SHADOW from 'resources/leaflet/marker-shadow.png'

const css = {
	zIndex: 1,
}

class CustomUrlEsriProvider extends EsriProvider {
	constructor(options = {}) {
		super(options)
	}

	endpoint({ query, protocol } = {}) {
		const { params } = this.options
		const paramString = this.getParamString({
			...params,
			f: 'json',
			text: query,
		})
		return `${protocol}//${this.options.url}?${paramString}`
	}
  }

const geoSearcherProviders = {
	ESRI: () => { return new CustomUrlEsriProvider({url: Settings.imagery.geoSearcher.url, params: {maxLocations: 10}}) },
	OSM: () => { return new OpenStreetMapProvider() },
}

const searchProvider = Settings.imagery.geoSearcher && geoSearcherProviders[Settings.imagery.geoSearcher.provider]()

class BaseLeaflet extends Component {
	static propTypes = {
		width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
		height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
		marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
		markers: PropTypes.array,
		appSettings: PropTypes.object,
		mapId: PropTypes.string, // pass this when you have more than one map on a page
	}

	static defaultProps = {
		width: '100%',
		height: '500px',
		marginBottom: '18px',
	}

	constructor(props) {
		super(props)

		this.state = {
			map: null,
			center: null,
			markerLayer: null
		}

		this.icon = new Icon({
			iconUrl: MARKER_ICON,
			iconRetinaUrl: MARKER_ICON_2X,
			shadowUrl: MARKER_SHADOW,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			tooltipAnchor: [16, -28],
			shadowSize: [41, 41]
		})
	}

	get mapId() {
		const mapId = this.props.mapId || 'default'
		return 'map-' + mapId
	}

	componentDidMount() {		
		Map.addInitHook('addHandler', 'gestureHandling', GestureHandling)
		const mapOptions = Object.assign({zoomControl:true, gestureHandling:true},
										 Settings.imagery.mapOptions.leafletOptions,
										 Settings.imagery.mapOptions.crs && { crs: CRS[Settings.imagery.mapOptions.crs] })
		const map = new Map(this.mapId, mapOptions).setView(Settings.imagery.mapOptions.homeView.location,
															Settings.imagery.mapOptions.homeView.zoomLevel)
		if (searchProvider) {
			new GeoSearchControl({ provider: searchProvider }).addTo(map)
		}

		const layerControl = new Control.Layers({}, {}, {collapsed:false})

		layerControl.addTo(map)
		this.addLayers(map,layerControl)

		map.on('moveend', this.moveEnd)

		const markerLayer = new FeatureGroup([]).addTo(map)
		this.setState({map, markerLayer})
	}

	componentDidUpdate(prevProps, prevState) {
		const prevMarkerIds = _sortBy(prevProps.markers.map(m => m.id))
		const markerIds = _sortBy(this.props.markers.map(m => m.id))
		if (!_isEqual(prevMarkerIds, markerIds)) {
			const markersToAdd = this.props.markers.filter(m =>
				prevProps.markers.findIndex(pm => pm.id === m.id) === -1
			)
			const markersToRemove = prevProps.markers.filter(pm =>
				this.props.markers.findIndex(m => m.id === pm.id) === -1
			)
			this.updateMarkerLayer(markersToAdd, markersToRemove)
		}

		if (prevState.map !== this.state.map) {
			this.updateMarkerLayer(this.props.markers)
		}
		if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
			this.state.map.invalidateSize()
		}
	}

	@autobind
	updateMarkerLayer(markersToAdd, markersToRemove) {
		let markers = markersToAdd || []
		markersToRemove = markersToRemove || []

		let newMarkers = []
		let markerLayer = this.state.markerLayer
		markers.forEach(m => {
			let latLng = (Location.hasCoordinates(m)) ? [m.lat, m.lng] : this.state.map.getCenter()
			let marker = new Marker(latLng, {icon: this.icon, draggable: (m.draggable || false), id: m.id})
			if (m.name) {
				marker.bindPopup(_escape(m.name)) // escape HTML!
			}
			if (m.onMove) {
				marker.on('move', m.onMove)
			}
			newMarkers.push(marker)
			markerLayer.addLayer(marker)
		})

		markersToRemove.forEach(m => {
			const ml = markerLayer.getLayers().find(ml => ml.options.id === m.id)
			markerLayer.removeLayer(ml)
		})

		if (newMarkers.length > 0) {
			if (markerLayer.getBounds() && markerLayer.getBounds().isValid()) {
				this.state.map.fitBounds(markerLayer.getBounds(), {maxZoom: 15})
			}
		}
	}

	@autobind
	addLayers(map, layerControl) {
		let defaultLayer = null
		Settings.imagery.baseLayers.forEach(layerConfig => {
			let layer = null
			if (layerConfig.type === 'wms') {
				layer = new TileLayer.WMS(layerConfig.url, layerConfig.options)
			} else if (layerConfig.type === 'osm' || layerConfig.type === 'tile') {
				layer = new TileLayer(layerConfig.url, layerConfig.options)
			}

			if (layer) {
				layerControl.addBaseLayer(layer, layerConfig.name)
			}
			if (layerConfig.default) { defaultLayer = layer  }
		})
		if (defaultLayer) { map.addLayer(defaultLayer) }
	}

	render() {
		const style = Object.assign({}, css, {width: this.props.width, height: this.props.height, marginBottom: this.props.marginBottom})
		return (
			<div id={this.mapId} style={style} />
		)
	}

	@autobind
	moveEnd(event) {
		const center = this.state.map.getCenter()

		this.setState({center: [center.lat, center.lng].join(',')})
	}

}

const Leaflet = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseLeaflet appSettings={context.appSettings} {...props} />
		}
	</AppContext.Consumer>
)

export default Leaflet
