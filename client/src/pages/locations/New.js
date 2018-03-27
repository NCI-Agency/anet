import React from 'react'

import NavigationWarning from 'components/NavigationWarning'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import LocationForm from 'pages/locations/Form'

import {Location} from 'models'

export default class LocationNew extends ValidatableFormWrapper {
	static pageProps = {
		useNavigation: false
	}

	constructor(props) {
		super(props)

		this.state = {
			location: new Location(),
		}
	}

	render() {
		let location = this.state.location

		return (
			<div>
				<NavigationWarning original={new Location()} current={location} />

				<Breadcrumbs items={[['Create new Location', Location.pathForNew()]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<LocationForm anetLocation={location} />
			</div>
		)
	}
}
