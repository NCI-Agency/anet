import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps} from 'components/Page'

import Messages from 'components/Messages'

import LocationForm from './Form'
import {Location} from 'models'

import API from 'api'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class LocationEdit extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			location: {},
			originalLocation : {}
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			location(id:${props.match.params.id}) {
				id, name, status, lat, lng
			}
		`).then(data => {
			this.setState({location: new Location(data.location), originalLocation : new Location(data.location) })
		})
	}

	render() {
		let location = this.state.location

		return (
			<div>
				<Messages error={this.state.error} success={this.state.success} />

				<LocationForm original={this.state.originalLocation} anetLocation={location} edit />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(LocationEdit)
