import PropTypes from 'prop-types'
import React, {Component} from 'react'
import autobind from 'autobind-decorator'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import MARKER_ICON from 'resources/leaflet/marker-icon.png'
import MARKER_ICON_2X from 'resources/leaflet/marker-icon-2x.png'
import MARKER_SHADOW from 'resources/leaflet/marker-shadow.png'

const css = {
	height: '500px',
	marginBottom: '18px',
	zIndex: 1,
}

export default class Leaflet extends Component {
	static propTypes = {
		markers: PropTypes.array,
	}
	static contextTypes = {
		app: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props)

		this.state = {
			map: null,
			center: null,
			layerControl: null,
			markerLayer: null,
			hasLayers: false
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

	componentDidMount() {
		// let app = this.context.app;

		let map = L.map('map', {zoomControl:true}).setView([34.52, 69.16], 10)
/*		let nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
		    layers: 'nexrad-n0r-900913',
		    format: 'image/png',
		    transparent: true,
		    attribution: "Weather data © 2012 IEM Nexrad"
		});
		let nmra = L.tileLayer.wms("https://mrdata.usgs.gov/services/nmra", {
			layers: 'USNationalMineralAssessment1998',
			format: 'image/png',
			transparent: true
		})

		let osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

		let baseLayers = { "Nexrad" : nexrad, "NMRA" : nmra, "OSM" : osm}
*/
		let layerControl = L.control.layers({}, {})
		layerControl.addTo(map)

		map.on('moveend', this.moveEnd)

		let state = this.state
		state.map = map
		state.layerControl = layerControl
		state.markerLayer = L.featureGroup([]).addTo(map)
		this.setState(state)

		this.tryAddLayers()
		this.updateMarkerLayer(this.props.markers)
	}

	@autobind
	tryAddLayers() {
		if (this.state.hasLayers === false) {
			this.addLayers()
		}
	}

	componentWillUnmount() {
		this.setState({hasLayers:false})
	}

	componentWillReceiveProps(nextProps) {
		this.tryAddLayers()

		let existingMarkers = this.state.markerLayer.getLayers()
		let markersToAdd = nextProps.markers.filter(m =>
			existingMarkers.findIndex(el => el.options.id === m.id) === -1
		)
		let markersToRemove = existingMarkers.filter(m =>
			nextProps.markers.findIndex(el => m.options.id === el.id) === -1
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
			let latLng = (m.lat && m.lng) ? [m.lat, m.lng] : this.state.map.getCenter()
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
	addLayers() {
		let app = this.context.app
		let rawLayers = app.state.settings.MAP_LAYERS
		if (!rawLayers || rawLayers.length === 0) {
			return
		}

		let mapLayers = JSON.parse(rawLayers)

		let defaultLayer = null
		mapLayers.forEach(l => {
			let layer = null
			if (l.type === 'wms') {
				layer = L.tileLayer.wms(l.url, {
					layers: l.layer,
					format: l.format || 'image/png'
				})
			} else if (l.type === 'osm') {
				layer = L.tileLayer(l.url)
			}

			if (layer) {
				this.state.layerControl.addBaseLayer(layer, l.name)
			}
			if (l.default) { defaultLayer = layer  }
		})
		if (defaultLayer) { this.state.map.addLayer(defaultLayer) }
		this.setState({hasLayers:true})
	}

	render() {
		return (
			<div>
				<div id="map" style={css} />
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
