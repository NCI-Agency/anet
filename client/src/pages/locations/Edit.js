import React from 'react'
import Page from 'components/Page'

import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'

import LocationForm from './Form'
import {Location} from 'models'

import API from 'api'

export default class LocationEdit extends Page {
	static pageProps = {
		useNavigation: false
	}

	constructor(props) {
		super(props)

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

				<NavigationWarning original={this.state.originalLocation} current={location} />
				<LocationForm anetLocation={location} edit />
			</div>
		)
	}
}
