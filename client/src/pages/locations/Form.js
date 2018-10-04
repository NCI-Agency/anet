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
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool,
	}

	constructor(props) {
		super(props)

		this.state = {
			success: null,
			error: null,
			isBlocking: false,
		}
	}

	render() {
		const location = this.props.anetLocation
		const marker = {
			id: location.uuid || 0,
			name: location.name || '',
			draggable: true,
			onMove: this.onMarkerMove
		}
		if (Location.hasCoordinates(location)) {
			Object.assign(marker, {
				lat: location.lat,
				lng: location.lng,
			})
		}
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
					<Leaflet markers={[marker]} />

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
			isBlocking: this.formHasUnsavedChanges(this.props.anetLocation, this.props.original),
		})
	}

	@autobind
	onSubmit(event) {
		let loc = this.props.anetLocation
		let edit = this.props.edit
		const operation = edit ? 'updateLocation' : 'createLocation'
		let graphql = operation + '(location: $location)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { location: loc }
		const variableDef = '($location: LocationInput!)'
		this.setState({isBlocking: false})
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (data[operation].uuid) {
					loc.id = data[operation].uuid
				}
				this.props.history.replace(Location.pathForEdit(loc))
				this.props.history.push({
					pathname: Location.pathFor(loc),
					state: {
						success: 'Location saved',
					}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}

}

export default withRouter(LocationForm)
