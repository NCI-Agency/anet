import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import LocationForm from 'pages/locations/Form'

import {Location} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class LocationNew extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			location: new Location(),
		}
	}

	render() {
		let location = this.state.location

		return (
			<div>
				<Breadcrumbs items={[['Create new Location', Location.pathForNew()]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<LocationForm original={new Location()} anetLocation={location} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(LocationNew)
