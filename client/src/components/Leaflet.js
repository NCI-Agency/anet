import PropTypes from 'prop-types'
import React, {Component} from 'react'
import autobind from 'autobind-decorator'
import {Location} from 'models'
import AppContext from 'components/AppContext'
import _escape from 'lodash/escape'
import _isEqual from 'lodash/isEqual'
import _sortBy from 'lodash/sortBy'

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

	get mapId() {
		const mapId = this.props.mapId || 'default'
		return 'map-' + mapId
	}

	componentDidMount() {
		let map = L.map(this.mapId, {zoomControl:true}).setView([34.52, 69.16], 10)
/*
		let nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
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
		this.setState(state, () => {
			this.tryAddLayers()
			this.updateMarkerLayer(this.props.markers)
		})
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

	componentDidUpdate(prevProps, prevState) {
		this.tryAddLayers()

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
	addLayers() {
		const { appSettings } = this.props || {}
		let rawLayers = appSettings.MAP_LAYERS
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
