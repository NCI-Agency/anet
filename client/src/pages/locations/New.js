import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import LocationForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import {Location} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class LocationNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	state = {
		location: new Location(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	render() {
		const { location } = this.state
		return (
			<div>
				<Breadcrumbs items={[['New Location', Location.pathForNew()]]} />
				<LocationForm initialValues={location} title='Create a new Location' />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(LocationNew)
