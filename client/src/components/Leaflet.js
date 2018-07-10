import PropTypes from 'prop-types'
import React, {Component} from 'react'
import autobind from 'autobind-decorator'
import {Location} from 'models'
import AppContext from 'components/AppContext'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Settings from 'Settings'

import MARKER_ICON from 'resources/leaflet/marker-icon.png'
import MARKER_ICON_2X from 'resources/leaflet/marker-icon-2x.png'
import MARKER_SHADOW from 'resources/leaflet/marker-shadow.png'

const css = {
	height: '500px',
	marginBottom: '18px',
	zIndex: 1,
}

class BaseLeaflet extends Component {
	static propTypes = {
		markers: PropTypes.array,
		appSettings: PropTypes.object,
		mapId: PropTypes.string, // pass this when you have more than one map on a page
	}

	constructor(props) {
		super(props)

		this.state = {
			map: null,
			center: null,
			markerLayer: null
		}

		this.icon = L.icon({
			iconUrl:       MARKER_ICON,
			iconRetinaUrl: MARKER_ICON_2X,
			shadowUrl:     MARKER_SHADOW,
			iconSize:    [25, 41],
			iconAnchor:  [12, 41],
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
		const mapOptions = Object.assign({zoomControl:true}, Settings.imagery.mapOptions, Settings.imagery.mapOptions.crs && { crs: L.CRS[Settings.imagery.mapOptions.crs] })
		const map = L.map(this.mapId, mapOptions).setView([34.52, 69.16], 10)
		const layerControl = L.control.layers({}, {}, {collapsed:false})

		layerControl.addTo(map)
		this.addLayers(map,layerControl)

		map.on('moveend', this.moveEnd)

		let state = this.state
		state.map = map
		state.markerLayer = L.featureGroup([]).addTo(map)
		this.setState(state, () => {
			this.updateMarkerLayer(this.props.markers)
		})
	}


	componentDidUpdate(prevProps, prevState) {
		const existingMarkers = this.state.markerLayer.getLayers()
		const markersToAdd = this.props.markers.filter(m =>
			existingMarkers.findIndex(el => el.options.id === m.id) === -1
		)
		const markersToRemove = existingMarkers.filter(m =>
			this.props.markers.findIndex(el => m.options.id === el.id) === -1
		)
		this.updateMarkerLayer(markersToAdd, markersToRemove)
	}

	@autobind
	updateMarkerLayer(markersToAdd, markersToRemove) {
		let markers = markersToAdd || []
		markersToRemove = markersToRemove || []

		let newMarkers = []
		let markerLayer = this.state.markerLayer
		markers.forEach(m => {
			let latLng = (Location.hasCoordinates(m)) ? [m.lat, m.lng] : this.state.map.getCenter()
			let marker = L.marker(latLng, {icon: this.icon, draggable: (m.draggable || false), id: m.id})
				.bindPopup(m.name)
			if (m.onMove) {
				marker.on('move', m.onMove)
			}
			newMarkers.push(marker)
			markerLayer.addLayer(marker)
		})

		markersToRemove.forEach(m => {
			markerLayer.removeLayer(m)
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
				layer = L.tileLayer.wms(layerConfig.url, layerConfig.options)
			} else if (layerConfig.type === 'osm' || layerConfig.type === 'tile') {
				layer = L.tileLayer(layerConfig.url, layerConfig.options)
			}

			if (layer) {
				layerControl.addBaseLayer(layer, layerConfig.name)
			}
			if (layerConfig.default) { defaultLayer = layer  }
		})
		if (defaultLayer) { map.addLayer(defaultLayer) }
	}

	render() {
		return (
			<div>
				<div id={this.mapId} style={css} />
			</div>
		)
	}

	@autobind
	moveEnd(event) {
		let map = this.state.map
		let center = map.getCenter()

		this.setState({map, center: [center.lat, center.lng].join(',')})
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
