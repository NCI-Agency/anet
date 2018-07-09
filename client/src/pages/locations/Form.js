import PropTypes from 'prop-types'
import React from 'react'
import {Button} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import Messages from 'components/Messages'
import Leaflet from 'components/Leaflet'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'

import API from 'api'
import {Location} from 'models'

import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import { jumpToTop } from 'components/Page'

class LocationForm extends ValidatableFormWrapper {
	static propTypes = {
		anetLocation: PropTypes.object.isRequired,
		edit: PropTypes.bool,
	}

	constructor(props) {
		super(props)

		this.state = {
			isBlocking: false,
			markers: [{id: 0, draggable: true, onMove: this.onMarkerMove}]
		}
	}

	static getDerivedStateFromProps(props, state) {
		if (Location.hasCoordinates(props.anetLocation)) {
			const loc = props.anetLocation
			let marker = state.markers[0]
			marker.name = loc.name
			marker.lat = loc.lat
			marker.lng = loc.lng
			marker.id = loc.id
			return {markers: [marker]}
		}
		return null
	}

	render() {
		let location = this.props.anetLocation
		let markers = this.state.markers
		let edit = this.props.edit

		const {ValidatableForm, RequiredField} = this

		function Coordinate(props) {
			const coord = typeof props.coord === 'number' ? Math.round(props.coord * 1000) / 1000 : '?'
			return <span>{coord}</span>
		}

		return (
			<div>
				<NavigationWarning isBlocking={this.state.isBlocking} />

				<Messages success={this.state.success} error={this.state.error} />

				<ValidatableForm formFor={location} onChange={this.onChange} onSubmit={this.onSubmit} horizontal submitText="Save location">
					{this.state.error && <fieldset><p>There was a problem saving this location</p><p>{this.state.error}</p></fieldset>}

					<Fieldset title={edit ? `Edit Location ${location.name}` : "Create new Location"}>
						<RequiredField id="name" />

						<Form.Field id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value={ Location.STATUS.ACTIVE }>Active</Button>
								<Button id="statusInactiveButton" value={ Location.STATUS.INACTIVE }>Inactive</Button>
							</ButtonToggleGroup>
						</Form.Field>

						<Form.Field type="static" id="location">
							<Coordinate coord={location.lat} />, <Coordinate coord={location.lng} />
						</Form.Field>
					</Fieldset>

					<h3>Drag the marker below to set the location</h3>
					<Leaflet markers={markers} />

				</ValidatableForm>
			</div>
		)
	}

	@autobind
	onMarkerMove(event) {
		let latLng = event.latlng
		let loc = this.props.anetLocation
		loc.lat = latLng.lat
		loc.lng = latLng.lng
		this.onChange()
	}

	@autobind
	onChange() {
		this.setState({
			isBlocking: this.formHasUnsavedChanges(this.state.report, this.props.original),
		})
		this.forceUpdate()
	}

	@autobind
	onSubmit(event) {
		let loc = this.props.anetLocation
		let edit = this.props.edit
		let url = `/api/locations/${edit ? 'update'  :'new'}`
		this.setState({isBlocking: false})
		this.forceUpdate()
		API.send(url, loc, {disableSubmits: true})
			.then(response => {
				if (response.id) {
					loc.id = response.id
				}
				this.props.history.push({
					pathname: Location.pathFor(loc),
					state: {
						success: 'Saved Location',
					}
				})
			}).catch(error => {
				this.setState({error: error})
				jumpToTop()
			})
	}

}

export default withRouter(LocationForm)
